
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
      setProcessedFiles([]);
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

            leftPage.drawPage(embeddedPage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });

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
    setFiles([]);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-20 h-[500px] w-[500px] rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-900/15" />
        <div className="absolute -bottom-32 -right-20 h-[450px] w-[450px] rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/15" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-100/30 blur-3xl dark:bg-purple-900/10" />
      </div>

      <div className="flex-grow w-full flex flex-col items-center justify-center">
        <header className="text-center mb-12">
          {/* Icon badge */}
          <div className="flex justify-center mb-5">
            <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 p-4 shadow-lg shadow-violet-500/30 dark:shadow-violet-500/20">
              <Scissors className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
            Diviseur de PDF
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto text-base leading-relaxed">
            Divisez vos PDF de pages doubles en pages uniques — instantanément, sans inscription, gratuitement.
          </p>
        </header>

        <main className="w-full max-w-3xl">
          {isProcessing ? (
            <Card className="w-full border-0 shadow-xl shadow-violet-500/10 dark:shadow-violet-500/5">
              <CardHeader className="text-center pt-8">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 p-3">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl">Traitement en cours…</CardTitle>
                <CardDescription>Veuillez patienter pendant que nous divisons vos fichiers.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-3 px-8 pb-10">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-sm text-muted-foreground">{Math.round(progress)}% terminé</p>
              </CardContent>
            </Card>
          ) : processedFiles.length > 0 ? (
            <div className="space-y-5">
              <Card className="border-0 shadow-xl shadow-violet-500/10 dark:shadow-violet-500/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-2 shadow shadow-violet-500/30">
                      <Download className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Vos PDF sont prêts !</CardTitle>
                      <CardDescription>Téléchargez-les individuellement ou en archive ZIP.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-6">
                  {processedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-4 hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15 p-2 shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium truncate" title={`split-${file.originalName}`}>
                          {`split-${file.originalName}`}
                        </p>
                      </div>
                      <Button asChild size="sm" className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 border-0 shadow shadow-violet-500/25">
                        <a href={file.splitPdfUrl} download={`split-${file.originalName}`}>
                          <Download className="h-4 w-4 mr-1.5" /> Télécharger
                        </a>
                      </Button>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 border-t px-6 py-5 mt-2">
                  <Button variant="outline" onClick={resetState} className="sm:w-auto w-full">
                    Diviser d'autres PDF
                  </Button>
                  <Button
                    onClick={handleDownloadAll}
                    disabled={processedFiles.length === 0}
                    className="sm:w-auto w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 border-0 shadow shadow-violet-500/25"
                  >
                    <Package className="h-4 w-4 mr-1.5" /> Tout télécharger (.zip)
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload zone */}
              <div
                className={cn(
                  "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
                  isDragging
                    ? "border-violet-500 bg-violet-50/80 dark:bg-violet-900/20 scale-[1.01]"
                    : "border-border hover:border-violet-400/60 hover:bg-violet-50/40 dark:hover:bg-violet-900/10"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
              >
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className={cn(
                    "rounded-2xl p-5 mb-5 transition-all duration-300",
                    isDragging
                      ? "bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/30"
                      : "bg-secondary group-hover:bg-gradient-to-br group-hover:from-violet-500/10 group-hover:to-indigo-500/10"
                  )}>
                    <UploadCloud className={cn(
                      "h-10 w-10 transition-colors duration-300",
                      isDragging ? "text-white" : "text-muted-foreground group-hover:text-primary"
                    )} />
                  </div>
                  <p className="font-semibold text-lg mb-1">Glissez-déposez vos fichiers ici</p>
                  <p className="text-sm text-muted-foreground mb-4">ou cliquez pour parcourir</p>
                  <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    Format accepté : .pdf
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </div>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <Card className="border-0 shadow-xl shadow-violet-500/10 dark:shadow-violet-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Fichiers à traiter</CardTitle>
                    <CardDescription>
                      {files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6">
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15 p-1.5 shrink-0">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <span className="truncate text-sm font-medium" title={file.name}>{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                            <span className="sr-only">Supprimer le fichier</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="justify-end border-t px-6 py-5 mt-2">
                    <Button
                      onClick={handleProcessPdfs}
                      disabled={files.length === 0}
                      className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 border-0 shadow-md shadow-violet-500/25 px-6"
                    >
                      <Scissors className="h-4 w-4 mr-2" />
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
