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
import { UploadCloud, FileText, Download, Package, Loader2, X } from "lucide-react";
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
          title: "Invalid file type",
          description: "Only PDF files are accepted.",
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
        title: "No files selected",
        description: "Please upload at least one PDF file to process.",
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
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const newPdfDoc = await PDFDocument.create();

        for (const page of pdfDoc.getPages()) {
          const { width, height } = page.getSize();
          const halfWidth = width / 2;

          // Create left page
          const [leftPdfPage] = await newPdfDoc.copyPages(pdfDoc, [pdfDoc.getPages().indexOf(page)]);
          leftPdfPage.setCropBox(0, 0, halfWidth, height);
          
          // Create right page
          const [rightPdfPage] = await newPdfDoc.copyPages(pdfDoc, [pdfDoc.getPages().indexOf(page)]);
          rightPdfPage.setCropBox(halfWidth, 0, halfWidth, height);

          // Add pages to the new document
          newPdfDoc.addPage(leftPdfPage);
          newPdfDoc.addPage(rightPdfPage);
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
          title: `Error processing ${file.name}`,
          description: "The file might be corrupted or password-protected.",
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
        title: "Processing Complete",
        description: `${newProcessedFiles.length} PDF(s) split successfully.`,
        variant: "default",
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
        title: "Failed to create ZIP",
        description: "An error occurred while preparing the ZIP file for download.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline">PDF Splitter</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Easily split your double-page PDFs into single pages. Upload your files, and we'll handle the rest.
        </p>
      </header>
      
      <main className="w-full max-w-4xl">
        {isProcessing ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Processing your PDFs...</CardTitle>
              <CardDescription>Please wait while we split your files. This may take a moment.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4 p-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
            </CardContent>
          </Card>
        ) : processedFiles.length > 0 ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Split PDFs are Ready!</CardTitle>
                <CardDescription>Download your files individually or get them all in a ZIP archive.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {processedFiles.map((file, index) => (
                  <Card key={index} className="flex flex-col bg-card hover:shadow-md transition-shadow">
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                      <FileText className="h-8 w-8 text-primary shrink-0" />
                      <p className="font-medium truncate" title={`split-${file.originalName}`}>{`split-${file.originalName}`}</p>
                    </CardHeader>
                    <CardFooter className="mt-auto pt-0">
                      <Button asChild className="w-full">
                        <a href={file.splitPdfUrl} download={`split-${file.originalName}`}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-4 border-t pt-6 mt-6">
                  <Button variant="outline" onClick={resetState}>Split More PDFs</Button>
                  <Button onClick={handleDownloadAll} disabled={processedFiles.length === 0}>
                    <Package className="mr-2 h-4 w-4" /> Download All (.zip)
                  </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card 
              className={cn(
                "border-2 border-dashed transition-colors duration-300",
                isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CardContent className="p-6 text-center cursor-pointer" onClick={triggerFileSelect}>
                <div className="flex justify-center items-center">
                  <UploadCloud className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="mt-4 font-semibold text-lg">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <p className="text-xs text-muted-foreground mt-2">Accepted format: .pdf</p>
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
              <Card>
                <CardHeader>
                  <CardTitle>Files to Process</CardTitle>
                  <CardDescription>{files.length} file(s) selected. Click "Split PDFs" to start.</CardDescription>
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
                          <span className="sr-only">Remove file</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="justify-end border-t pt-6 mt-6">
                    <Button onClick={handleProcessPdfs} disabled={files.length === 0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M5.42 9.42 8 12"/><path d="M16 12h-2"/><path d="M12 12h-2"/><path d="M22 12h-2"/><path d="M8.83 14.83 5.17 18.5"/><path d="M18.83 5.17 15.17 8.83"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m22 2-8.5 8.5"/><path d="m14 14-8.5 8.5"/></svg>
                        Split PDFs
                    </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}