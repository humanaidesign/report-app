import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import type { Finding } from "../types";

interface AiInsightsProps {
  findings: Finding[];
  selectedFindingId: string | null;
  hiddenFindingIds: Set<string>;
  onFindingSelect: (id: string) => void;
  onRemoveFinding: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

const AiInsights: React.FC<AiInsightsProps> = ({
  findings,
  selectedFindingId,
  hiddenFindingIds,
  onFindingSelect,
  onRemoveFinding,
  onToggleVisibility,
  onGenerateReport,
  isGeneratingReport,
}) => (
  <Box
    sx={{
      p: 2,
      height: "fit-content",
      minHeight: 300,
      display: "flex",
      flexDirection: "column",
      bgcolor: "#1e1e1e",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: "bold", fontSize: "0.8rem" }}
      >
        AI Assistant Insights
      </Typography>
    </Box>
    <Box sx={{ overflowY: "auto", mb: 2 }}>
      <Stack spacing={1}>
        {findings.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ color: "#aaa", textAlign: "center", py: 2 }}
          >
            Upload an X-ray to see AI findings
          </Typography>
        ) : (
          findings.map((item) => {
            const isSelected = item.id === selectedFindingId;
            const isHidden = hiddenFindingIds.has(item.id);

            return (
              <Paper
                key={item.id}
                variant="outlined"
                sx={{
                  p: 1,
                  bgcolor: isSelected
                    ? "rgba(255, 152, 0, 0.15)"
                    : "rgba(216, 67, 21, 0.05)",
                  borderColor: isSelected ? "#ff9800" : "#d84315",
                  borderWidth: isSelected ? 2 : 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: isHidden ? "#666" : "white",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(255, 152, 0, 0.2)",
                    borderColor: "#ff9800",
                  },
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                  onClick={() => onFindingSelect(item.id)}
                >
                  <Box
                    sx={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: item.isCritical ? "#d84315" : "#555",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {item.id}
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                    {item.text}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(item.id);
                    }}
                    sx={{
                      padding: "2px",
                      color: isHidden ? "#555" : "#ff9800",
                      "&:hover": {
                        color: isHidden ? "#aaa" : "#ffb74d",
                        bgcolor: "rgba(255, 152, 0, 0.1)",
                      },
                    }}
                  >
                    {isHidden ? (
                      <VisibilityOffIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <VisibilityIcon sx={{ fontSize: 14 }} />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFinding(item.id);
                    }}
                    sx={{
                      color: "#999",
                      padding: "2px",
                      "&:hover": {
                        color: "#ff4444",
                        bgcolor: "rgba(255, 68, 68, 0.1)",
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Paper>
            );
          })
        )}
      </Stack>
    </Box>

    <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon sx={{ fontSize: 14 }} />}
        sx={{ flex: 1, bgcolor: "white", color: "black", fontSize: "0.65rem" }}
        disabled={findings.length === 0}
      >
        Add
      </Button>
      <Button
        variant="contained"
        size="small"
        onClick={onGenerateReport}
        disabled={findings.length === 0 || isGeneratingReport}
        sx={{ flex: 1, bgcolor: "#1976d2", fontSize: "0.65rem" }}
      >
        {isGeneratingReport ? "Generating..." : "Create Report"}
      </Button>
    </Box>
  </Box>
);

export default AiInsights;
