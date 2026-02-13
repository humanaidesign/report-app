import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  Button,
  CircularProgress,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import UploadIcon from "@mui/icons-material/Upload";
import type { Finding } from "../types";

interface XRayViewerProps {
  imageUrl: string;
  findings: Finding[];
  selectedFindingId: string | null;
  onFindingClick: (id: string) => void;
  onImageUpload: (file: File) => void;
  isAnalyzing: boolean;
}

const XRayViewer: React.FC<XRayViewerProps> = ({
  imageUrl,
  findings,
  selectedFindingId,
  onFindingClick,
  onImageUpload,
  isAnalyzing,
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (imageRef.current) {
        const dims = {
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight,
        };
        console.log("=== IMAGE DIMENSIONS ===");
        console.log("Rendered size:", dims);
        setImageDimensions(dims);
      }
    };

    const img = imageRef.current;
    if (img) {
      img.addEventListener("load", updateDimensions);
      updateDimensions();
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      if (img) {
        img.removeEventListener("load", updateDimensions);
      }
      window.removeEventListener("resize", updateDimensions);
    };
  }, [imageUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const scaleCoordinate = (value: number, dimension: number): number => {
    return (value / 1000) * dimension;
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        position: "relative",
        bgcolor: "black",
        border: "1px solid #ffffffaa",
        borderRadius: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {!imageUrl && !isAnalyzing && (
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          Upload X-Ray
        </Button>
      )}

      {isAnalyzing && (
        <Box sx={{ textAlign: "center", color: "white" }}>
          <CircularProgress sx={{ color: "#1976d2", mb: 2 }} />
          <Box>Analyzing X-Ray...</Box>
        </Box>
      )}

      {imageUrl && !isAnalyzing && (
        <>
          <Box
            ref={imageRef}
            component="img"
            src={imageUrl}
            alt="Chest X-Ray"
            sx={{
              maxHeight: "95%",
              maxWidth: "95%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              transition: "all 0.3s ease",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: imageDimensions.width,
              height: imageDimensions.height,
              pointerEvents: "none",
            }}
          >
            {findings.map((finding) => {
              if (!finding.boundingBox) return null;

              const { x, y, width, height } = finding.boundingBox;
              const isSelected = finding.id === selectedFindingId;

              const scaledLeft = scaleCoordinate(x, imageDimensions.width);
              const scaledTop = scaleCoordinate(y, imageDimensions.height);
              const scaledWidth = scaleCoordinate(width, imageDimensions.width);
              const scaledHeight = scaleCoordinate(
                height,
                imageDimensions.height,
              );

              console.log(`=== FINDING ${finding.id} ===`);
              console.log("Original coords from AI:", { x, y, width, height });
              console.log("Image dimensions:", imageDimensions);
              console.log("Scaled coords (actual pixels):", {
                left: scaledLeft,
                top: scaledTop,
                width: scaledWidth,
                height: scaledHeight,
              });

              return (
                <Box
                  key={finding.id}
                  onClick={() => onFindingClick(finding.id)}
                  sx={{
                    position: "absolute",
                    left: scaledLeft,
                    top: scaledTop,
                    width: scaledWidth,
                    height: scaledHeight,
                    border: isSelected
                      ? "3px solid #ff9800"
                      : "2px solid #d84315",
                    bgcolor: isSelected
                      ? "rgba(255, 152, 0, 0.2)"
                      : "rgba(216, 67, 21, 0.15)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    pointerEvents: "auto",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255, 152, 0, 0.25)",
                      borderColor: "#ff9800",
                      borderWidth: "3px",
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: -24,
                      left: 0,
                      bgcolor: "rgba(0, 0, 0, 0.8)",
                      color: "white",
                      px: 1,
                      py: 0.5,
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {finding.id}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {imageUrl && (
        <Stack
          direction="row"
          spacing={isSmall ? 0.5 : 1}
          sx={{
            position: "absolute",
            bottom: isSmall ? 8 : 14,
            left: "50%",
            transform: "translateX(-50%)",
            bgcolor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            borderRadius: 3,
            p: isSmall ? 0.2 : 0.4,
            border: "1px solid #ffffff",
            scale: isSmall ? "0.85" : "1",
          }}
        >
          <IconButton size="small" sx={{ color: "white" }}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: "white" }}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: "white" }}>
            <OpenWithIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: "white" }}>
            <RestartAltIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: "white" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Box>
  );
};

export default XRayViewer;
