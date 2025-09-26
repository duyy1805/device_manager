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
  useTheme,
  useMediaQuery,
  TableContainer,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import apiConfig from "../apiConfig.json";

type ThietBi = {
  DeviceId: number | null;
  DeviceCode?: string | null;
  DeviceName?: string | null;
  DeviceTypeId?: number | null;
  DeviceTypeName?: string | null;
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
type DeviceType = {
  Id: number;
  DeviceTypeName: string;
};

interface DailyCheckItem {
  DeviceId: number;
  CheckItemId: number;
  CheckItemName: string;
  InspectionId?: number | null;
  Status?: string | null;
  Note?: string | null;
  InspectionDate?: string | null;
}

function B9device() {
  const [data, setData] = useState<ThietBi[]>([]);
  const [deviceType, setDeviceType] = useState<DeviceType[]>([]);
  const dataRef = useRef<ThietBi[]>([]);
  const [dailyCheckList, setDailyCheckList] = useState([]);
  const [dailyCheckDialogOpen, setDailyCheckDialogOpen] = useState(false);
  const [dailyCheckItems, setDailyCheckItems] = useState<DailyCheckItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ThietBi | null>(null);
  const [editingField, setEditingField] = useState<string>("");
  const [editedDevice, setEditedDevice] = useState<ThietBi | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogAllDeviceOpen, setDialogAllDeviceOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const lastScannedCodeRef = useRef<string | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scannerInitializedRef = useRef(false);

  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [filters, setFilters] = useState({
    DeviceName: "",
    QualityRating: "",
    Unit: "",
  });
  const filteredData = data.filter((item) => {
    const matchDeviceName = item.DeviceName?.toLowerCase().includes(
      filters.DeviceName.toLowerCase() ?? ""
    );
    const matchQuality = filters.QualityRating
      ? String(item.QualityRating ?? "").includes(filters.QualityRating)
      : true;
    const matchUnit = item.Unit?.toLowerCase().includes(
      filters.Unit.toLowerCase() ?? ""
    );

    return matchDeviceName && matchQuality && matchUnit;
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // sm ~ 600px

  const USAGE_OPTIONS = [
    "Đang sử dụng",
    "Dự trữ",
    "Không sử dụng",
    "Chờ thanh lý",
  ];

  const columns = [
    { label: "Mã thiết bị", field: "DeviceCode", editable: false },
    { label: "Tên thiết bị", field: "DeviceName", editable: true },
    { label: "Loại thiết bị", field: "DeviceTypeName", editable: true },
    { label: "Đơn vị", field: "Unit", editable: true },
    { label: "Nước sản xuất", field: "MadeIn", editable: true },
    { label: "Năm sản xuất", field: "YearManufactured", editable: true },
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

  const columns_ = [
    { title: "Mã thiết bị", dataIndex: "DeviceCode", key: "DeviceCode" },
    { title: "Tên thiết bị", dataIndex: "DeviceName", key: "DeviceName" },
    {
      title: "Loại thiết bị",
      dataIndex: "DeviceTypeName",
      key: "DeviceTypeName",
    },
    { title: "Đơn vị", dataIndex: "Unit", key: "Unit" },
    { title: "Nước SX", dataIndex: "MadeIn", key: "MadeIn" },
    {
      title: "Năm SX",
      dataIndex: "YearManufactured",
      key: "YearManufactured",
      align: "center",
    },
    {
      title: "Năm SD",
      dataIndex: "YearUsed",
      key: "YearUsed",
      align: "center",
    },
    {
      title: "Chất lượng",
      dataIndex: "QualityRating",
      key: "QualityRating",
      align: "center",
    },
    { title: "Tình trạng", dataIndex: "UsageStatus", key: "UsageStatus" },
    {
      title: "Giá trị đầu",
      dataIndex: "InitialValue",
      key: "InitialValue",
      align: "right",
      render: (value: number) => `${value?.toLocaleString() ?? "0"} VND`,
    },
    {
      title: "Giá trị còn",
      dataIndex: "RemainingValue",
      key: "RemainingValue",
      align: "right",
      render: (value: number) => `${value?.toLocaleString() ?? "0"} VND`,
    },
    {
      title: "Ngày KT",
      dataIndex: "InspectionDate",
      key: "InspectionDate",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "-",
    },
    { title: "Ghi chú", dataIndex: "Note", key: "Note" },
  ];
  const handleSaveDevice = async () => {
    setDialogOpen(false);
    if (!editedDevice) return;
    const updated: ThietBi = {
      ...editedDevice,
      InspectionDate: new Date().toISOString(),
    };
    console.log(updated);
    try {
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/B9/insert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
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
      setOpenSnackbar(true);
      setEditedDevice(null);
      setEditingField("");
    } catch (error) {
      console.error("Lỗi khi lưu thiết bị:", error);
    }
  };
  const handleStatusChange = async (index: number, status: string) => {
    const updatedItem = {
      ...dailyCheckItems[index],
      Status: status,
    };
    console.log("Cập nhật trạng thái:", updatedItem);
    // Gọi API insert
    try {
      const response = await fetch(
        `${apiConfig.API_BASE_URL}/api/B9/insertdailyinspection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            DeviceId: updatedItem.DeviceId,
            CheckItemId: updatedItem.CheckItemId,
            Status: updatedItem.Status,
            Note: updatedItem.Note,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to insert inspection");
      }

      // Nếu thành công, cập nhật lại state
      setDailyCheckItems((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          Status: status,
          InspectionDate: new Date().toISOString(),
        };
        return updated;
      });
    } catch (error) {
      console.error("Error inserting inspection:", error);
      // Optionally show UI error message here
    }
  };

  const handleDeviceScanned = async (device: ThietBi | null, code: string) => {
    const updatedDevice: ThietBi = {
      ...(device ?? {
        DeviceId: null,
        DeviceName: null,
        DeviceTypeId: null,
        DeviceTypeName: null,
        Unit: null,
        MadeIn: null,
        YearManufactured: null,
        YearUsed: null,
        QualityRating: null,
        UsageStatus: null,
        InitialValue: null,
        RemainingValue: null,
        InspectionDate: null,
        Note: null,
      }),
      DeviceCode: code, // Sử dụng code được truyền vào, không dùng scannedCode
    };

    console.log("Scanned code:", code);
    setSelectedDevice(updatedDevice);
    setEditedDevice(updatedDevice);
    setDialogOpen(true);
  };

  const normalizeText = (text: string): string => {
    // Thay thế các ký tự đặc biệt nếu cần
    return text
      .replace(/Ð/g, "Đ") // Thay thế chữ "Ð" thành "Đ"
      .replace(/ð/g, "đ") // Thay thế chữ "ð" thành "đ"
      .toLowerCase(); // Chuyển về chữ thường để so sánh không phân biệt chữ hoa chữ thường
  };
  const startScanner = async () => {
    if (isScanningRef.current) return;

    try {
      const qrCodeScanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      );

      isScanningRef.current = true;

      await qrCodeScanner.render(
        (decodedText) => {
          // Lấy mã QR đầu tiên từ chuỗi (bỏ qua các dòng sau nếu có)
          const match = decodedText.match(/^[^\r\n]+/);
          const code: string = match ? match[0].trim() : "";
          setScannedCode(code);
          // Chuẩn hóa mã QR trước khi so sánh (giảm bớt sự khác biệt giữa các ký tự đặc biệt)
          const normalizedCode = normalizeText(code);
          console.log("Normalized code:", code);

          // Tránh việc quét lại mã đã quét trong 10s
          if (lastScannedCodeRef.current === normalizedCode) return;

          const device = dataRef.current.find(
            (item) =>
              item.DeviceCode &&
              normalizeText(item.DeviceCode) === normalizedCode
          );

          console.log("Device data:", dataRef.current);

          if (device) {
            handleDeviceScanned(device, code);
            lastScannedCodeRef.current = normalizedCode;
          } else {
            handleDeviceScanned(null, code);
            lastScannedCodeRef.current = normalizedCode;
          }

          // Sau 10s thì cho phép quét lại mã này
          if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = setTimeout(() => {
            lastScannedCodeRef.current = null;
          }, 10_000); // 10 giây
        },
        () => {
          // Có thể xử lý lỗi nếu quét không thành công
          console.error("Không thể quét mã.");
        }
      );
    } catch (err) {
      console.error("Lỗi khi khởi động scanner:", err);
    }
  };

  const stopScanner = async () => {
    if (!scannerInitializedRef.current) return;

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
    scannerInitializedRef.current = false;
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
    fetch(`${apiConfig.API_BASE_URL}/api/B9/b9devices`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Lỗi khi load dữ liệu:", err));
  }, []);

  useEffect(() => {
    fetch(`${apiConfig.API_BASE_URL}/api/B9/b9devicetype`)
      .then((res) => res.json())
      .then(setDeviceType)
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
        <Box id="reader" bgcolor="#FFFFFF" mt={2} width={350} mx="auto" />

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Thông tin thiết bị</DialogTitle>
          <DialogContent>
            <Table sx={{ minWidth: 500, whiteSpace: "nowrap" }}>
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
                          ) : field === "DeviceTypeName" ? (
                            <Select
                              autoFocus
                              fullWidth
                              value={editedDevice?.DeviceTypeName || ""}
                              onChange={(e) =>
                                setEditedDevice(
                                  (prev) =>
                                    ({
                                      ...prev,
                                      DeviceTypeName: e.target.value,
                                      DeviceTypeId:
                                        deviceType.find(
                                          (type) =>
                                            type.DeviceTypeName ===
                                            e.target.value
                                        )?.Id || null,
                                    } as ThietBi)
                                )
                              }
                              onBlur={() => {
                                setSelectedDevice(editedDevice);
                                setEditingField("");
                              }}
                            >
                              <MenuItem value="">
                                -- Chọn loại thiết bị --
                              </MenuItem>
                              {deviceType.map((type) => (
                                <MenuItem
                                  key={type.Id}
                                  value={type.DeviceTypeName}
                                >
                                  {type.DeviceTypeName}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <TextField
                              autoFocus
                              fullWidth
                              type={isDate ? "date" : "text"}
                              value={
                                editedDevice?.[field as keyof ThietBi] ?? ""
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
                              setEditedDevice({ ...selectedDevice } as ThietBi);
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

            {!selectedDevice?.DeviceName && (
              <Typography mt={2} color="error">
                Không tìm thấy thông tin thiết bị trong hệ thống. Chỉ có mã:{" "}
                <strong>{selectedDevice?.DeviceCode ?? "Không rõ"}</strong>
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

      <Button variant="outlined" onClick={() => setDialogAllDeviceOpen(true)}>
        Xem danh sách thiết bị
      </Button>
      {/* <Dialog
        open={dailyCheckDialogOpen}
        onClose={() => setDailyCheckDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Kiểm tra hằng ngày</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hạng mục</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell>Ngày kiểm tra</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dailyCheckItems.map((item, index) => (
                <TableRow
                  key={item.CheckItemId}
                  sx={{
                    backgroundColor:
                      item.Status === "Đạt"
                        ? "#e8f5e9"
                        : item.Status === "Không đạt"
                        ? "#ffebee"
                        : "inherit",
                  }}
                >
                  <TableCell>{item.CheckItemName}</TableCell>
                  <TableCell>
                    {typeof item.Status === "string" ? item.Status : "-"}
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      fullWidth
                      value={item.Note || ""}
                      onChange={(e) => {
                        const newItems = [...dailyCheckItems];
                        newItems[index].Note = e.target.value;
                        setDailyCheckItems(newItems);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {item.InspectionDate &&
                    typeof item.InspectionDate === "string"
                      ? new Date(item.InspectionDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      onClick={() => handleStatusChange(index, "Đạt")}
                      sx={{ mr: 1 }}
                    >
                      Đạt
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setPendingIndex(index);
                        setConfirmDialogOpen(true);
                      }}
                    >
                      Không đạt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog> */}

      <Dialog
        open={dialogAllDeviceOpen}
        onClose={() => {
          setDialogAllDeviceOpen(false);
        }}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>Danh sách thiết bị</DialogTitle>
        <DialogContent>
          <Box sx={{ overflowX: "auto", width: "100%" }}>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="Tên thiết bị"
                value={filters.DeviceName}
                onChange={(e) =>
                  setFilters({ ...filters, DeviceName: e.target.value })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                label="Chất lượng"
                type="number"
                value={filters.QualityRating}
                onChange={(e) =>
                  setFilters({ ...filters, QualityRating: e.target.value })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                label="Đơn vị"
                value={filters.Unit}
                onChange={(e) =>
                  setFilters({ ...filters, Unit: e.target.value })
                }
                variant="outlined"
                size="small"
              />
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table
                stickyHeader
                sx={{ width: "max-content", whiteSpace: "nowrap" }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Mã thiết bị</TableCell>
                    <TableCell>Tên thiết bị</TableCell>
                    <TableCell>Loại thiết bị</TableCell>
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
                  {filteredData.map((item, index) => (
                    <TableRow
                      key={index}
                      hover
                      onClick={() =>
                        handleDeviceScanned(item, item.DeviceCode!)
                      }
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.DeviceCode ?? "N/A"}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Tooltip title={item.DeviceName ?? "N/A"} arrow>
                          <span>{item.DeviceName ?? "N/A"}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{item.DeviceTypeName ?? "N/A"}</TableCell>
                      <TableCell>{item.Unit ?? "N/A"}</TableCell>
                      <TableCell>{item.MadeIn ?? "N/A"}</TableCell>
                      <TableCell align="center">
                        {item.YearManufactured ?? "-"}
                      </TableCell>
                      <TableCell align="center">
                        {item.YearUsed ?? "-"}
                      </TableCell>
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
                      <TableCell
                        sx={{
                          maxWidth: 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Tooltip title={item.Note ?? ""} arrow>
                          <span>{item.Note ?? ""}</span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Xác nhận</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn đánh dấu mục này là <strong>"Không đạt"</strong>
          ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Hủy</Button>
          <Button
            color="error"
            onClick={() => {
              if (pendingIndex !== null) {
                handleStatusChange(pendingIndex, "Không đạt");
              }
              setConfirmDialogOpen(false);
              setPendingIndex(null);
            }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Lưu thành công!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default B9device;
