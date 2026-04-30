import React, { useRef, useState, useCallback } from "react";
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
  hiddenFindingIds: Set<string>;
  allBoxesHidden: boolean;
  onFindingClick: (id: string) => void;
  onImageUpload: (file: File) => void;
  isAnalyzing: boolean;
}

const XRayViewer: React.FC<XRayViewerProps> = ({
  imageUrl,
  findings,
  selectedFindingId,
  hiddenFindingIds,
  allBoxesHidden,
  onFindingClick,
  onImageUpload,
  isAnalyzing,
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setIsPanMode(false);
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanMode) return;
      isPanning.current = true;
      setIsDragging(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
    },
    [isPanMode, translate],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setTranslate({
      x: translateStart.current.x + (e.clientX - panStart.current.x),
      y: translateStart.current.y + (e.clientY - panStart.current.y),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      return Math.min(Math.max(s + delta, 0.5), 5);
    });
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        minWidth: 0,
        position: "relative",
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
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ffffffaa",
            borderRadius: 1,
            bgcolor: "black",
          }}
        >
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#1565c0" } }}
          >
            Upload X-Ray
          </Button>
        </Box>
      )}

      {isAnalyzing && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ffffffaa",
            borderRadius: 1,
            bgcolor: "black",
          }}
        >
          <Box sx={{ textAlign: "center", color: "white" }}>
            <CircularProgress sx={{ color: "#1976d2", mb: 2 }} />
            <Box>Analyzing X-Ray...</Box>
          </Box>
        </Box>
      )}

      {imageUrl && !isAnalyzing && (
        <>
          <Box
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            sx={{
              position: "relative",
              display: "inline-flex",
              lineHeight: 0,
              border: "1px solid #ffffffaa",
              borderRadius: 1,
              bgcolor: "black",
              overflow: "hidden",
              maxHeight: "calc(100vh - 160px)",
              maxWidth: "100%",
              cursor: isPanMode
                ? isDragging
                  ? "grabbing"
                  : "grab"
                : "default",
            }}
          >
            <Box
              sx={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.2s ease",
                lineHeight: 0,
                position: "relative",
              }}
            >
              <img
                src={imageUrl}
                alt="Chest X-Ray"
                draggable={false}
                style={{
                  display: "block",
                  maxHeight: "calc(100vh - 160px)",
                  maxWidth: "100%",
                  width: "auto",
                  height: "auto",
                  userSelect: "none",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              >
                {!allBoxesHidden &&
                  findings.map((finding) => {
                    if (!finding.boundingBox) return null;
                    if (hiddenFindingIds.has(finding.id)) return null;

                    const { x, y, width, height } = finding.boundingBox;
                    const isSelected = finding.id === selectedFindingId;

                    const toPercent = (v: number) => `${(v / 1000) * 100}%`;

                    return (
                      <div
                        key={finding.id}
                        onClick={() => onFindingClick(finding.id)}
                        style={{
                          position: "absolute",
                          left: toPercent(x),
                          top: toPercent(y),
                          width: toPercent(width),
                          height: toPercent(height),
                          border: isSelected
                            ? "3px solid #ff9800"
                            : "2px solid #d84315",
                          backgroundColor: isSelected
                            ? "rgba(255, 152, 0, 0.2)"
                            : "rgba(216, 67, 21, 0.15)",
                          borderRadius: "4px",
                          cursor: "pointer",
                          pointerEvents: "auto",
                          transition: "all 0.2s ease",
                          boxSizing: "border-box",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255, 152, 0, 0.25)";
                          e.currentTarget.style.borderColor = "#ff9800";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isSelected
                            ? "rgba(255, 152, 0, 0.2)"
                            : "rgba(216, 67, 21, 0.15)";
                          e.currentTarget.style.borderColor = isSelected
                            ? "#ff9800"
                            : "#d84315";
                        }}
                      />
                    );
                  })}
              </Box>
            </Box>
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
                zIndex: 10,
              }}
            >
              <IconButton
                size="small"
                sx={{ color: "white" }}
                onClick={handleZoomIn}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: "white" }}
                onClick={handleZoomOut}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: isPanMode ? "#1976d2" : "white",
                  bgcolor: isPanMode ? "rgba(25,118,194,0.2)" : "transparent",
                }}
                onClick={() => setIsPanMode((p) => !p)}
              >
                <OpenWithIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: "white" }}
                onClick={handleReset}
              >
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
          </Box>
        </>
      )}
    </Box>
  );
};

export default XRayViewer;
