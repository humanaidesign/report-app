import React, { useRef } from "react";
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
  onFindingClick: (id: string) => void;
  onImageUpload: (file: File) => void;
  isAnalyzing: boolean;
}

const XRayViewer: React.FC<XRayViewerProps> = ({
  imageUrl,
  findings,
  selectedFindingId,
  hiddenFindingIds,
  onFindingClick,
  onImageUpload,
  isAnalyzing,
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            sx={{
              position: "relative",
              display: "inline-block",
              lineHeight: 0,
            }}
          >
            <img
              src={imageUrl}
              alt="Chest X-Ray"
              style={{
                display: "block",
                maxHeight: "calc(100vh - 160px)",
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                transition: "all 0.3s ease",
              }}
            />
            {/* Plain div overlay — bypasses MUI sx so % values reach CSS directly */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              {findings.map((finding) => {
                if (!finding.boundingBox) return null;
                if (hiddenFindingIds.has(finding.id)) return null;

                const { x, y, width, height } = finding.boundingBox;
                const isSelected = finding.id === selectedFindingId;

                // Convert 0-1000 coords to percentages so boxes scale with the image
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
                  >
                    {/* Finding ID label */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-24px",
                        left: 0,
                        backgroundColor: "rgba(0,0,0,0.8)",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {finding.id}
                    </div>
                  </div>
                );
              })}
            </div>
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
