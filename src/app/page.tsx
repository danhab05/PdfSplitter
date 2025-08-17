
"use client";

import { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileText, Download, Package, Loader2, X, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";

type ProcessedFile = {
  originalName: string;
  splitPdfBlob: Blob;
  splitPdfUrl: string;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).filter(
        (file) => file.type === "application/pdf"
      );
      if (newFiles.length !== selectedFiles.length) {
        toast({
          title: "Type de fichier invalide",
          description: "Seuls les fichiers PDF sont acceptés.",
          variant: "destructive",
        });
      }
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      setProcessedFiles([]); // Clear previous results
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const resetState = () => {
    setFiles([]);
    setProcessedFiles([]);
    setIsProcessing(false);
    setProgress(0);
  };

  const handleProcessPdfs = async () => {
    if (files.length === 0) {
      toast({
        title: "Aucun fichier sélectionné",
        description: "Veuillez télécharger au moins un fichier PDF à traiter.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessedFiles([]);
    const newProcessedFiles: ProcessedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const existingPdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(existingPdfBytes, {
          updateMetadata: false
        });
        const newPdfDoc = await PDFDocument.create();

        for (const originalPage of pdfDoc.getPages()) {
            const { width, height } = originalPage.getSize();
            const halfWidth = width / 2;

            const leftPage = newPdfDoc.addPage([halfWidth, height]);
            const rightPage = newPdfDoc.addPage([halfWidth, height]);

            const [embeddedPage] = await newPdfDoc.embedPdf(pdfDoc.getPages().indexOf(originalPage) < 0 ? await pdfDoc.copyPages(pdfDoc, [pdfDoc.getPages().indexOf(originalPage)]) : existingPdfBytes, [pdfDoc.getPages().indexOf(originalPage)]);
            
            // Draw left half
            leftPage.drawPage(embeddedPage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });

            // Draw right half
            rightPage.drawPage(embeddedPage, {
                x: -halfWidth,
                y: 0,
                width: width,
                height: height,
            });
        }
        
        const newPdfBytes = await newPdfDoc.save();
        const splitPdfBlob = new Blob([newPdfBytes], { type: "application/pdf" });
        const splitPdfUrl = URL.createObjectURL(splitPdfBlob);
        
        newProcessedFiles.push({
          originalName: file.name,
          splitPdfBlob,
          splitPdfUrl,
        });

      } catch (err) {
        console.error(err);
        toast({
          title: `Erreur lors du traitement de ${file.name}`,
          description: "Le fichier est peut-être corrompu ou protégé par un mot de passe.",
          variant: "destructive",
        });
      }
      setProgress(((i + 1) / files.length) * 100);
    }

    setProcessedFiles(newProcessedFiles);
    setIsProcessing(false);
    setFiles([]); // Move files to processed section

    if (newProcessedFiles.length > 0) {
      toast({
        title: "Traitement terminé",
        description: `${newProcessedFiles.length} PDF divisé(s) avec succès.`,
      });
    }
  };

  const handleDownloadAll = async () => {
    if (processedFiles.length === 0) return;
    
    const zip = new JSZip();
    processedFiles.forEach(file => {
      zip.file(`split-${file.originalName}`, file.splitPdfBlob);
    });

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = "split_pdfs.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch(err) {
      console.error(err);
      toast({
        title: "Échec de la création du ZIP",
        description: "Une erreur s'est produite lors de la préparation du fichier ZIP pour le téléchargement.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="flex-grow w-full flex flex-col items-center justify-center">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">Diviseur de PDF</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Divisez facilement vos PDF de pages doubles en pages uniques. Téléchargez vos fichiers, et nous nous occupons du reste avec précision.
          </p>
        </header>
        
        <main className="w-full max-w-4xl">
          {isProcessing ? (
            <Card className="w-full shadow-lg">
              <CardHeader>
                <CardTitle>Traitement de vos PDF en cours...</CardTitle>
                <CardDescription>Veuillez patienter pendant que nous divisons vos fichiers. Cela peut prendre un moment.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 p-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{Math.round(progress)}% terminé</p>
              </CardContent>
            </Card>
          ) : processedFiles.length > 0 ? (
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Vos PDF divisés sont prêts !</CardTitle>
                  <CardDescription>Téléchargez vos fichiers individuellement ou récupérez-les tous dans une archive ZIP.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processedFiles.map((file, index) => (
                    <Card key={index} className="flex flex-col bg-card/50 hover:shadow-md transition-shadow">
                      <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                        <FileText className="h-8 w-8 text-primary shrink-0" />
                        <p className="font-medium truncate" title={`split-${file.originalName}`}>{`split-${file.originalName}`}</p>
                      </CardHeader>
                      <CardFooter className="mt-auto pt-0">
                        <Button asChild className="w-full">
                          <a href={file.splitPdfUrl} download={`split-${file.originalName}`}>
                            <Download /> Télécharger
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-end gap-4 border-t pt-6 mt-6">
                  <Button variant="outline" onClick={resetState}>Diviser d'autres PDF</Button>
                  <Button onClick={handleDownloadAll} disabled={processedFiles.length === 0}>
                    <Package /> Tout télécharger (.zip)
                  </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card 
              className={cn(
                "border-2 border-dashed transition-colors duration-300 bg-transparent",
                isDragging ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50"
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CardContent className="p-10 text-center cursor-pointer" onClick={triggerFileSelect}>
                <div className="flex justify-center items-center">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="mt-4 font-semibold text-lg">Glissez-déposez les fichiers ici</p>
                <p className="text-sm text-muted-foreground">ou cliquez pour parcourir</p>
                <p className="text-xs text-muted-foreground mt-2">Format accepté : .pdf</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </CardContent>
            </Card>

            {files.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Fichiers à traiter</CardTitle>
                  <CardDescription>{files.length} fichier(s) sélectionné(s). Cliquez sur "Diviser les PDF" pour commencer.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm" title={file.name}>{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(index)}>
                          <X className="h-4 w-4"/>
                          <span className="sr-only">Supprimer le fichier</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="justify-end border-t pt-6 mt-6">
                    <Button onClick={handleProcessPdfs} disabled={files.length === 0}>
                        <Scissors />
                        Diviser les PDF
                    </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

    