import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import type { Finding, FindingStatus } from "../types";

interface ISpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface CombinedPanelProps {
  findings: Finding[];
  selectedFindingId: string | null;
  hiddenFindingIds: Set<string>;
  allBoxesHidden: boolean;
  onFindingSelect: (id: string) => void;
  onRemoveFinding: (id: string) => void;
  onToggleAllBoxes: () => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
  reportText: string;
  onReportChange: (text: string) => void;
  onAddFinding: (text: string, isAbnormal: boolean) => void;
}

const STATUS_CONFIG: Record<
  "abnormal" | "normal",
  { color: string; bg: string; border: string; label: string; dot: string }
> = {
  abnormal: {
    color: "#ef5350",
    bg: "rgba(239, 83, 80, 0.13)",
    border: "rgba(239, 83, 80, 0.45)",
    label: "Abnormal",
    dot: "#ef5350",
  },
  normal: {
    color: "#90a4ae",
    bg: "rgba(144, 164, 174, 0.1)",
    border: "rgba(144, 164, 174, 0.3)",
    label: "Normal",
    dot: "#90a4ae",
  },
};

function getCategory(status: FindingStatus): "abnormal" | "normal" {
  return status === "worsened" || status === "changed" ? "abnormal" : "normal";
}

function StatusPill({ status }: { status: FindingStatus }) {
  const cat = getCategory(status);
  const cfg = STATUS_CONFIG[cat];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        px: "7px",
        py: "3px",
        borderRadius: "4px",
        bgcolor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </Box>
  );
}

const CombinedPanel: React.FC<CombinedPanelProps> = ({
  findings,
  selectedFindingId,
  allBoxesHidden,
  onFindingSelect,
  onRemoveFinding,
  onToggleAllBoxes,
  isGeneratingReport,
  reportText,
  onReportChange,
  onAddFinding,
}) => {
  const [findingListening, setFindingListening] = useState(false);
  const [findingTranscript, setFindingTranscript] = useState("");
  const [findingSpeechError, setFindingSpeechError] = useState("");
  const [showFindingConfirm, setShowFindingConfirm] = useState(false);
  const [editedFindingText, setEditedFindingText] = useState("");

  const [impressionListening, setImpressionListening] = useState(false);
  const [impressionTranscript, setImpressionTranscript] = useState("");
  const [impressionSpeechError, setImpressionSpeechError] = useState("");
  const [showImpressionConfirm, setShowImpressionConfirm] = useState(false);
  const [editedImpressionText, setEditedImpressionText] = useState("");

  const findingRecognitionRef = useRef<ISpeechRecognition | null>(null);
  const impressionRecognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      if (findingRecognitionRef.current) findingRecognitionRef.current.stop();
      if (impressionRecognitionRef.current)
        impressionRecognitionRef.current.stop();
    };
  }, []);

  const startFindingListening = () => {
    setFindingSpeechError("");
    setFindingTranscript("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFindingSpeechError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setFindingTranscript(full);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      setFindingSpeechError(`Microphone error: ${event.error}`);
      setFindingListening(false);
    };

    recognition.onend = () => {
      setFindingListening(false);
    };

    findingRecognitionRef.current = recognition;
    recognition.start();
    setFindingListening(true);
  };

  const stopFindingListening = () => {
    if (findingRecognitionRef.current) findingRecognitionRef.current.stop();
    setFindingListening(false);
    if (findingTranscript.trim()) {
      setEditedFindingText(findingTranscript.trim());
      setShowFindingConfirm(true);
    }
  };

  const handleConfirmFinding = (isAbnormal: boolean) => {
    if (editedFindingText.trim()) {
      onAddFinding(editedFindingText.trim(), isAbnormal);
    }
    setShowFindingConfirm(false);
    setFindingTranscript("");
    setEditedFindingText("");
  };

  const handleCancelFinding = () => {
    setShowFindingConfirm(false);
    setFindingTranscript("");
    setEditedFindingText("");
  };

  const startImpressionListening = () => {
    setImpressionSpeechError("");
    setImpressionTranscript("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setImpressionSpeechError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setImpressionTranscript(full);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      setImpressionSpeechError(`Microphone error: ${event.error}`);
      setImpressionListening(false);
    };

    recognition.onend = () => {
      setImpressionListening(false);
    };

    impressionRecognitionRef.current = recognition;
    recognition.start();
    setImpressionListening(true);
  };

  const stopImpressionListening = () => {
    if (impressionRecognitionRef.current)
      impressionRecognitionRef.current.stop();
    setImpressionListening(false);
    if (impressionTranscript.trim()) {
      setEditedImpressionText(impressionTranscript.trim());
      setShowImpressionConfirm(true);
    }
  };

  const handleConfirmImpression = () => {
    if (editedImpressionText.trim()) {
      const currentFindings = findings.map((f) => f.text).join(". ");
      const currentImpression = parseImpression(reportText);
      const newImpression = currentImpression
        ? `${currentImpression} ${editedImpressionText.trim()}`
        : editedImpressionText.trim();
      onReportChange(
        `Findings:\n${currentFindings}\n\nImpression:\n${newImpression}`,
      );
    }
    setShowImpressionConfirm(false);
    setImpressionTranscript("");
    setEditedImpressionText("");
  };

  const handleCancelImpression = () => {
    setShowImpressionConfirm(false);
    setImpressionTranscript("");
    setEditedImpressionText("");
  };

  const parseImpression = (text: string): string => {
    if (!text) return "";
    const match = text.match(/Impression:?\s*([\s\S]*?)$/i);
    return match ? match[1].trim() : "";
  };

  const impression = parseImpression(reportText);

  const sorted = [...findings].sort((a, b) => {
    const aAbnormal =
      getCategory((a.status ?? "same") as FindingStatus) === "abnormal" ? 0 : 1;
    const bAbnormal =
      getCategory((b.status ?? "same") as FindingStatus) === "abnormal" ? 0 : 1;
    if (aAbnormal !== bAbnormal) return aAbnormal - bAbnormal;
    if (a.isCritical && !b.isCritical) return -1;
    if (!a.isCritical && b.isCritical) return 1;
    return 0;
  });

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#161a1d",
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <KeyboardArrowDownIcon sx={{ fontSize: 17, color: "#78909c" }} />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.85rem",
            color: "#eceff1",
            letterSpacing: "0.02em",
            flex: 1,
          }}
        >
          Radiology Report
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            px: 1.5,
            pt: 1.25,
            pb: 0.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#78909c",
            }}
          >
            Findings
          </Typography>
          <IconButton
            size="small"
            onClick={onToggleAllBoxes}
            title={
              allBoxesHidden
                ? "Show all bounding boxes"
                : "Hide all bounding boxes"
            }
            sx={{
              p: "3px",
              color: allBoxesHidden ? "#2a3540" : "#607d8b",
              "&:hover": { color: "#90a4ae" },
            }}
          >
            {allBoxesHidden ? (
              <VisibilityOffIcon sx={{ fontSize: 16 }} />
            ) : (
              <VisibilityIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Box>

        <Box sx={{ px: 1.25, pb: 1 }}>
          <Stack spacing={0.75}>
            {findings.length === 0 ? (
              <Typography
                sx={{
                  color: "#546e7a",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  py: 3,
                }}
              >
                Upload an X-ray to see AI findings
              </Typography>
            ) : (
              sorted.map((item) => {
                const isSelected = item.id === selectedFindingId;
                const status = (item.status ?? "same") as FindingStatus;
                const cat = getCategory(status);
                const cfg = STATUS_CONFIG[cat];

                return (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    onClick={() => onFindingSelect(item.id)}
                    sx={{
                      px: 1.25,
                      py: 1,
                      bgcolor: isSelected ? cfg.bg : "rgba(255,255,255,0.03)",
                      borderColor: isSelected
                        ? cfg.border
                        : "rgba(255,255,255,0.08)",
                      borderWidth: isSelected ? "1.5px" : "1px",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: cfg.bg,
                        borderColor: cfg.border,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 3,
                        height: 32,
                        borderRadius: 4,
                        bgcolor: cfg.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.82rem",
                        color: "#cfd8dc",
                        flex: 1,
                        lineHeight: 1.35,
                      }}
                    >
                      {item.text}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        flexShrink: 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StatusPill status={status} />
                      <IconButton
                        size="small"
                        onClick={() => onRemoveFinding(item.id)}
                        sx={{
                          p: "3px",
                          color: "#37474f",
                          "&:hover": {
                            color: "#ef5350",
                            bgcolor: "rgba(239,83,80,0.08)",
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Box>

        <Box sx={{ px: 1.25, pb: 1.25 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={
              findingListening ? stopFindingListening : startFindingListening
            }
            startIcon={
              findingListening ? (
                <StopIcon sx={{ fontSize: 14 }} />
              ) : (
                <MicIcon sx={{ fontSize: 14 }} />
              )
            }
            disabled={findings.length === 0}
            fullWidth
            sx={{
              fontSize: "0.75rem",
              borderColor: findingListening
                ? "rgba(239, 83, 80, 0.6)"
                : "rgba(255,255,255,0.15)",
              color: findingListening ? "#ef5350" : "#78909c",
              bgcolor: findingListening
                ? "rgba(239, 83, 80, 0.08)"
                : "transparent",
              animation: findingListening
                ? "pulse 1.4s ease-in-out infinite"
                : "none",
              "@keyframes pulse": {
                "0%": { boxShadow: "0 0 0 0 rgba(239, 83, 80, 0.4)" },
                "70%": { boxShadow: "0 0 0 6px rgba(239, 83, 80, 0)" },
                "100%": { boxShadow: "0 0 0 0 rgba(239, 83, 80, 0)" },
              },
              "&:hover": {
                borderColor: findingListening
                  ? "rgba(239, 83, 80, 0.9)"
                  : "rgba(255,255,255,0.3)",
                bgcolor: findingListening
                  ? "rgba(239, 83, 80, 0.15)"
                  : "rgba(255,255,255,0.04)",
              },
            }}
          >
            {findingListening ? "Stop Recording" : "Add Finding"}
          </Button>

          {findingListening && (
            <Box
              sx={{
                mt: 0.75,
                px: 1.25,
                py: 0.75,
                bgcolor: "rgba(239, 83, 80, 0.06)",
                border: "1px solid rgba(239, 83, 80, 0.25)",
                borderRadius: "6px",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  color: "#ef5350",
                  fontWeight: 700,
                  mb: 0.4,
                }}
              >
                ● RECORDING
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  color: findingTranscript ? "#cfd8dc" : "#546e7a",
                  fontStyle: findingTranscript ? "normal" : "italic",
                  lineHeight: 1.4,
                }}
              >
                {findingTranscript || "Start speaking…"}
              </Typography>
            </Box>
          )}

          {findingSpeechError && (
            <Box
              sx={{
                mt: 0.75,
                px: 1.25,
                py: 0.75,
                bgcolor: "rgba(239, 83, 80, 0.08)",
                border: "1px solid rgba(239, 83, 80, 0.3)",
                borderRadius: "6px",
              }}
            >
              <Typography sx={{ fontSize: "0.78rem", color: "#ef9a9a" }}>
                {findingSpeechError}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <Box sx={{ px: 1.5, pt: 1.25, pb: 1.25 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#78909c",
              mb: 1,
            }}
          >
            Impression
          </Typography>

          {impressionListening && (
            <Box
              sx={{
                mb: 1,
                px: 1.25,
                py: 0.75,
                bgcolor: "rgba(239, 83, 80, 0.06)",
                border: "1px solid rgba(239, 83, 80, 0.25)",
                borderRadius: "6px",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  color: "#ef5350",
                  fontWeight: 700,
                  mb: 0.4,
                }}
              >
                ● RECORDING
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  color: impressionTranscript ? "#cfd8dc" : "#546e7a",
                  fontStyle: impressionTranscript ? "normal" : "italic",
                  lineHeight: 1.4,
                }}
              >
                {impressionTranscript || "Start speaking…"}
              </Typography>
            </Box>
          )}

          {impressionSpeechError && (
            <Box
              sx={{
                mb: 1,
                px: 1.25,
                py: 0.75,
                bgcolor: "rgba(239, 83, 80, 0.08)",
                border: "1px solid rgba(239, 83, 80, 0.3)",
                borderRadius: "6px",
              }}
            >
              <Typography sx={{ fontSize: "0.78rem", color: "#ef9a9a" }}>
                {impressionSpeechError}
              </Typography>
            </Box>
          )}

          {reportText ? (
            <TextField
              multiline
              fullWidth
              value={impression}
              onChange={(e) => {
                const currentFindings = findings.map((f) => f.text).join(". ");
                onReportChange(
                  `Findings:\n${currentFindings}\n\nImpression:\n${e.target.value}`,
                );
              }}
              placeholder="Impression will appear here after dictating..."
              variant="outlined"
              minRows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#eceff1",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
              }}
            />
          ) : (
            <Typography
              sx={{
                color: "#546e7a",
                fontSize: "0.85rem",
                fontStyle: "italic",
                py: 2,
                textAlign: "center",
              }}
            >
              Dictate an impression using the button below
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          px: 1.25,
          py: 1.25,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          disabled={!reportText}
          sx={{
            flex: 1,
            fontSize: "0.75rem",
            borderColor: "rgba(255,255,255,0.15)",
            color: "#78909c",
            "&:hover": {
              borderColor: "rgba(255,255,255,0.3)",
              bgcolor: "rgba(255,255,255,0.04)",
            },
          }}
        >
          Save Draft
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={
            impressionListening
              ? stopImpressionListening
              : startImpressionListening
          }
          disabled={findings.length === 0 || isGeneratingReport}
          startIcon={
            impressionListening ? (
              <StopIcon sx={{ fontSize: 14 }} />
            ) : (
              <MicIcon sx={{ fontSize: 14 }} />
            )
          }
          sx={{
            flex: 1,
            fontSize: "0.75rem",
            bgcolor: impressionListening ? "rgba(239, 83, 80, 0.85)" : "#1565c0",
            animation: impressionListening
              ? "pulse 1.4s ease-in-out infinite"
              : "none",
            "@keyframes pulse": {
              "0%": { boxShadow: "0 0 0 0 rgba(239, 83, 80, 0.4)" },
              "70%": { boxShadow: "0 0 0 6px rgba(239, 83, 80, 0)" },
              "100%": { boxShadow: "0 0 0 0 rgba(239, 83, 80, 0)" },
            },
            "&:hover": {
              bgcolor: impressionListening ? "#ef5350" : "#1976d2",
            },
            "&.Mui-disabled": { bgcolor: "#1a2530", color: "#37474f" },
          }}
        >
          {impressionListening ? "Stop" : "Add Impression"}
        </Button>
      </Box>

      <Dialog
        open={showFindingConfirm}
        onClose={handleCancelFinding}
        PaperProps={{
          sx: {
            bgcolor: "#1e2730",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            minWidth: 340,
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#eceff1",
            fontSize: "0.92rem",
            fontWeight: 700,
            pb: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MicIcon sx={{ fontSize: 18, color: "#78909c" }} />
          Confirm Finding
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: "#78909c",
              fontWeight: 700,
              mb: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Edit if needed
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            value={editedFindingText}
            onChange={(e) => setEditedFindingText(e.target.value)}
            variant="outlined"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: "#eceff1",
                fontSize: "0.88rem",
                lineHeight: 1.5,
                "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&.Mui-focused fieldset": { borderColor: "#1976d2" },
              },
            }}
          />

          <Typography
            sx={{
              fontSize: "0.72rem",
              color: "#78909c",
              fontWeight: 700,
              mb: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Classify as
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleConfirmFinding(true)}
              sx={{
                borderColor: "rgba(239, 83, 80, 0.5)",
                color: "#ef5350",
                fontSize: "0.82rem",
                py: 1,
                "&:hover": {
                  borderColor: "#ef5350",
                  bgcolor: "rgba(239, 83, 80, 0.1)",
                },
              }}
            >
              Abnormal
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleConfirmFinding(false)}
              sx={{
                borderColor: "rgba(144, 164, 174, 0.4)",
                color: "#90a4ae",
                fontSize: "0.82rem",
                py: 1,
                "&:hover": {
                  borderColor: "#90a4ae",
                  bgcolor: "rgba(144, 164, 174, 0.1)",
                },
              }}
            >
              Normal
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
          <Button
            onClick={handleCancelFinding}
            size="small"
            sx={{ color: "#546e7a", fontSize: "0.78rem" }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showImpressionConfirm}
        onClose={handleCancelImpression}
        PaperProps={{
          sx: {
            bgcolor: "#1e2730",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            minWidth: 340,
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#eceff1",
            fontSize: "0.92rem",
            fontWeight: 700,
            pb: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MicIcon sx={{ fontSize: 18, color: "#78909c" }} />
          Confirm Impression
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: "#78909c",
              fontWeight: 700,
              mb: 0.75,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Edit if needed
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={editedImpressionText}
            onChange={(e) => setEditedImpressionText(e.target.value)}
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#eceff1",
                fontSize: "0.88rem",
                lineHeight: 1.5,
                "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&.Mui-focused fieldset": { borderColor: "#1976d2" },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2, pt: 1, gap: 0.5 }}>
          <Button
            onClick={handleCancelImpression}
            size="small"
            sx={{ color: "#546e7a", fontSize: "0.78rem" }}
          >
            Discard
          </Button>
          <Button
            onClick={handleConfirmImpression}
            variant="contained"
            size="small"
            disabled={!editedImpressionText.trim()}
            sx={{
              bgcolor: "#1565c0",
              fontSize: "0.78rem",
              "&:hover": { bgcolor: "#1976d2" },
            }}
          >
            Add to Impression
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CombinedPanel;