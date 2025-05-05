import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { Html5Qrcode } from "html5-qrcode";

type ThietBi = {
  DeviceId: number;
  DeviceCode?: string | null;
  DeviceName?: string | null;
  Unit?: string | null;
  MadeIn?: string | null;
  YearManufactured?: number | null;
  YearUsed?: number | null;
  InspectionId?: number | null;
  InspectionDate?: string | null;
  QualityRating?: number | null;
  UsageStatus?: string | null;
  InitialValue?: number | null;
  RemainingValue?: number | null;
  Note?: string | null;
};

function B9device() {
  const [data, setData] = useState<ThietBi[]>([]);
  const dataRef = useRef<ThietBi[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ThietBi | null>(null);
  const [editingField, setEditingField] = useState<string>("");
  const [editedDevice, setEditedDevice] = useState<ThietBi | null>(null);
  // const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const lastScannedCodeRef = useRef<string | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const USAGE_OPTIONS = [
    "Đang sử dụng",
    "Dự trữ",
    "Không sử dụng",
    "Chờ thanh lý",
  ];

  const columns = [
    { label: "Mã thiết bị", field: "DeviceCode", editable: false },
    { label: "Tên thiết bị", field: "DeviceName", editable: true },
    { label: "Đơn vị", field: "Unit", editable: true },
    { label: "Nước sản xuất", field: "MadeIn", editable: true },
    { label: "Năm sản xuất", field: "YearManufactured", editable: false },
    { label: "Năm sử dụng", field: "YearUsed", editable: true },
    { label: "Chất lượng", field: "QualityRating", editable: true },
    { label: "Tình trạng", field: "UsageStatus", editable: true },
    {
      label: "Giá trị đầu",
      field: "InitialValue",
      editable: false,
      isCurrency: true,
    },
    {
      label: "Giá trị còn lại",
      field: "RemainingValue",
      editable: true,
      isCurrency: true,
    },
    {
      label: "Ngày kiểm tra",
      field: "InspectionDate",
      editable: false,
      isDate: true,
    },
    { label: "Ghi chú", field: "Note", editable: true },
  ];

  const handleSaveDevice = async () => {
    setDialogOpen(false);
    if (!editedDevice) return;
    const updated: ThietBi = {
      ...editedDevice,
      InspectionDate: new Date().toISOString(),
    };
    console.log(updated);
    const inspection = {
      DeviceId: updated.DeviceId,
      QualityRating: updated.QualityRating || null,
      UsageStatus: updated.UsageStatus || null,
      InitialValue: updated.InitialValue || null,
      RemainingValue: updated.RemainingValue || null,
      Note: updated.Note || null,
    };
    // Gọi API cập nhật lên server
    try {
      const response = await fetch("https://localhost:7220/api/B9/insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inspection),
      });

      if (!response.ok) throw new Error("Lưu thất bại");

      const result = await response.json();
      console.log("Thành công:", result);

      // Cập nhật local state
      setData((prev) =>
        prev.map((item) =>
          item.DeviceCode === updated.DeviceCode ? updated : item
        )
      );
      setSelectedDevice(updated);
      setEditedDevice(null);
      setEditingField("");
    } catch (error) {
      console.error("Lỗi khi lưu thiết bị:", error);
    }
  };

  const startScanner = async () => {
    if (isScanningRef.current) return;

    try {
      const qrCodeScanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = qrCodeScanner;
      isScanningRef.current = true;

      await qrCodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (lastScannedCodeRef.current === decodedText) return;
          const device = dataRef.current.find(
            (item) => item.DeviceCode === decodedText
          );
          if (device) {
            setSelectedDevice(device);
            setDialogOpen(true); // mở dialog hiển thị chi tiết
            lastScannedCodeRef.current = decodedText;
          }
          // Sau 10s thì cho phép quét lại mã này
          if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = setTimeout(() => {
            lastScannedCodeRef.current = null;
          }, 10_000); // 10 giây
        },
        () => {}
      );
    } catch (err) {
      console.error("Lỗi khi khởi động scanner:", err);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Không thể dừng scanner:", err);
      }
      html5QrCodeRef.current = null;
    }
    isScanningRef.current = false;
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    // Khi đóng dialog thì restart lại scanner
    if (!dialogOpen) {
      startScanner();
    }
  }, [dialogOpen]);

  useEffect(() => {
    fetch("https://localhost:7220/api/B9/b9devices")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Lỗi khi load dữ liệu:", err));
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={4}
      mb={4}
    >
      <Typography variant="h5" fontWeight="bold">
        Danh sách thiết bị
      </Typography>
      <Typography variant="h5" fontWeight="bold">
        Quét mã QR thiết bị
      </Typography>

      <Box p={2}>
        <Box id="reader" mt={2} width={350} mx="auto" />

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Thông tin thiết bị</DialogTitle>
          <DialogContent>
            {selectedDevice ? (
              <Table size="small">
                <TableBody>
                  {columns.map(
                    ({ label, field, editable, isCurrency, isDate }) => (
                      <TableRow key={field}>
                        <TableCell width="30%" sx={{ fontWeight: 500 }}>
                          {label}
                        </TableCell>
                        <TableCell width="55%">
                          {editingField === field ? (
                            field === "UsageStatus" ? (
                              <Select
                                autoFocus
                                fullWidth
                                value={editedDevice?.UsageStatus || ""}
                                onChange={(e) =>
                                  setEditedDevice(
                                    (prev) =>
                                      ({
                                        ...prev,
                                        UsageStatus: e.target.value,
                                      } as ThietBi)
                                  )
                                }
                                onBlur={() => {
                                  setSelectedDevice(editedDevice);
                                  setEditingField("");
                                }}
                              >
                                <MenuItem value="">
                                  -- Chọn tình trạng --
                                </MenuItem>
                                {USAGE_OPTIONS.map((opt) => (
                                  <MenuItem key={opt} value={opt}>
                                    {opt}
                                  </MenuItem>
                                ))}
                              </Select>
                            ) : (
                              <TextField
                                autoFocus
                                fullWidth
                                type={isDate ? "date" : "text"}
                                value={
                                  selectedDevice?.[field as keyof ThietBi] ??
                                  "N/A"
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (
                                    isCurrency ||
                                    field.includes("Year") ||
                                    field === "QualityRating"
                                  ) {
                                    if (/^\d*$/.test(value)) {
                                      setEditedDevice(
                                        (prev) =>
                                          ({
                                            ...prev,
                                            [field]:
                                              value === "" ? "" : Number(value),
                                          } as ThietBi)
                                      );
                                    }
                                  } else {
                                    setEditedDevice(
                                      (prev) =>
                                        ({
                                          ...prev,
                                          [field]: value,
                                        } as ThietBi)
                                    );
                                  }
                                }}
                                onBlur={() => {
                                  setSelectedDevice(editedDevice);
                                  setEditingField("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setSelectedDevice(editedDevice);
                                    setEditingField("");
                                  }
                                }}
                              />
                            )
                          ) : isDate ? (
                            selectedDevice?.[field as keyof ThietBi] ? (
                              new Date(
                                selectedDevice[field as keyof ThietBi] as string
                              ).toLocaleDateString()
                            ) : (
                              "-"
                            )
                          ) : isCurrency ? (
                            Number(
                              selectedDevice?.[field as keyof ThietBi] ?? 0
                            ).toLocaleString() + " VND"
                          ) : (
                            selectedDevice?.[field as keyof ThietBi] ?? "N/A"
                          )}
                        </TableCell>
                        <TableCell width="15%" align="right">
                          {editable && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                setEditingField(field);
                                setEditedDevice({ ...selectedDevice });
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            ) : (
              <Typography color="error">
                Không tìm thấy thông tin thiết bị.
              </Typography>
            )}
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button variant="contained" onClick={handleSaveDevice}>
                Lưu
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>

      <Button variant="outlined" onClick={() => setDialogOpen(true)}>
        Xem danh sách thiết bị
      </Button>

      <Dialog open={false} fullWidth maxWidth="xl">
        <DialogTitle>Danh sách thiết bị</DialogTitle>
        <DialogContent>
          <Box overflow="auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Mã thiết bị</TableCell>
                  <TableCell>Tên thiết bị</TableCell>
                  <TableCell>Đơn vị</TableCell>
                  <TableCell>Nước SX</TableCell>
                  <TableCell>Năm SX</TableCell>
                  <TableCell>Năm SD</TableCell>
                  <TableCell>Chất lượng</TableCell>
                  <TableCell>Tình trạng</TableCell>
                  <TableCell align="right">Giá trị đầu</TableCell>
                  <TableCell align="right">Giá trị còn</TableCell>
                  <TableCell>Ngày KT</TableCell>
                  <TableCell>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.DeviceCode ?? "N/A"}</TableCell>
                    <TableCell>{item.DeviceName ?? "N/A"}</TableCell>
                    <TableCell>{item.Unit ?? "N/A"}</TableCell>
                    <TableCell>{item.MadeIn ?? "N/A"}</TableCell>
                    <TableCell align="center">
                      {item.YearManufactured ?? "-"}
                    </TableCell>
                    <TableCell align="center">{item.YearUsed ?? "-"}</TableCell>
                    <TableCell align="center">
                      {item.QualityRating ?? "-"}
                    </TableCell>
                    <TableCell>{item.UsageStatus ?? "N/A"}</TableCell>
                    <TableCell align="right">
                      {item.InitialValue?.toLocaleString() ?? "0"} VND
                    </TableCell>
                    <TableCell align="right">
                      {item.RemainingValue?.toLocaleString() ?? "0"} VND
                    </TableCell>
                    <TableCell>
                      {item.InspectionDate
                        ? new Date(item.InspectionDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>{item.Note ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default B9device;
