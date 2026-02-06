"use client";

import React, { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  label?: string;
}

export function CameraCapture({ onCapture, label = "Ambil Foto" }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      // Convert base64 to File
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          onCapture(file);
        });
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImage(null);
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden shadow-md">
        {image ? (
          <img src={image} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: facingMode,
              aspectRatio: 4 / 3,
            }}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex gap-4">
        {image ? (
          <Button onClick={retake} variant="outline" className="w-full">
            <RefreshCw className="mr-2 size-4" /> Foto Ulang
          </Button>
        ) : (
          <Button onClick={capture} className="w-full">
            <Camera className="mr-2 size-4" /> {label}
          </Button>
        )}
      </div>
    </div>
  );
}
