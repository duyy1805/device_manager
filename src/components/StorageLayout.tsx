import React, { useEffect, useState } from "react";
import apiConfig from "../apiConfig.json";
import { DoorOpen } from "lucide-react";
import { Drawer, Form, Input, Button, Space, Popconfirm } from "antd";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
interface StorageCell {
  Area: string;
  Compartment: number;
  RowNumber: number;
  Code: string;
  ProductName: string;
  Quantity: number;
  LastUpdated: string;
}
interface Savelayout {
  Area: string;
  Compartment: number;
  RowNumber: number;
  ProductName: string;
  Quantity: number;
}
interface SelectedCell {
  Area: string;
  Comp: number;
  Row: number;
}
const StorageLayout: React.FC = () => {
  const [data, setData] = useState<StorageCell[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [compartments, setCompartments] = useState<number[]>([]);
  const [rows, setRows] = useState<number[]>([]);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selected, setSelected] = useState<StorageCell | null>(null);
  const [productName, setProductName] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [quantityChange, setQuantityChange] = useState<number | string>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${apiConfig.API_BASE_URL}/api/B9/storagelocation`
        );
        const result: StorageCell[] = await res.json();
        setData(result);
        console.log(result);

        const uniqueAreas = Array.from(new Set(result.map((r) => r.Area)));
        const uniqueCompartments = Array.from(
          new Set(result.map((r) => r.Compartment))
        );
        const uniqueRows = Array.from(new Set(result.map((r) => r.RowNumber)));

        // Sắp xếp (nếu cần)
        setAreas(uniqueAreas.sort());
        setCompartments(uniqueCompartments.sort((a, b) => a - b));
        setRows(uniqueRows.sort((a, b) => a - b));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleQuantityChange = (
    operation: "increase" | "decrease" | "reset"
  ): void => {
    if (!selectedCell) return;
    const cell = data.find(
      (d) =>
        d.Area === selectedCell.Area &&
        d.Compartment === selectedCell.Comp &&
        d.RowNumber === selectedCell.Row
    );
    if (!cell) return;
    let newQuantity = cell.Quantity;
    if (operation === "increase") {
      newQuantity += quantityChange as number;
    } else if (operation === "decrease") {
      newQuantity -= quantityChange as number;
    } else if (operation === "reset") {
      newQuantity = 0;
    }
    const savelayout: Savelayout = {
      Area: selectedCell.Area,
      Compartment: selectedCell.Comp,
      RowNumber: selectedCell.Row,
      ProductName: productName,
      Quantity: newQuantity,
    };

    console.log("Dữ liệu cần lưu:", savelayout);
    fetch(`${apiConfig.API_BASE_URL}/api/B9/savestorage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(savelayout),
    })
      .then((response) => {
        if (!response.ok) {
          console.log(response);
          throw new Error("Lỗi khi lưu dữ liệu");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Dữ liệu đã được lưu thành công:", data);
        setData((prevData) => {
          return prevData.map((d) => {
            if (
              d.Area === selectedCell.Area &&
              d.Compartment === selectedCell.Comp &&
              d.RowNumber === selectedCell.Row
            ) {
              return {
                ...d,
                ProductName: productName,
                Quantity: newQuantity,
                LastUpdated: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              };
            }
            return d;
          });
        });
        // alert("Lưu thành công!");
      })
      .catch((error) => {
        console.log("Lỗi khi lưu layout:", error);
        alert("Lưu thất bại!");
      });
  };
  const exportToExcel = (
    data: StorageCell[],
    fileName = "storage_data.xlsx"
  ) => {
    // Chuyển đổi dữ liệu JSON thành worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Tạo workbook và thêm worksheet vào
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Storage");

    // Ghi file và tạo Blob để lưu
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    // Lưu file
    saveAs(blob, fileName);
  };
  const handleCellClick = (area: string, comp: number, row: number): void => {
    setSelectedCell({
      Area: area,
      Comp: comp,
      Row: row,
    });
    const cell = data.find(
      (d) => d.Area === area && d.Compartment === comp && d.RowNumber === row
    );
    if (cell) {
      setSelected(cell);
      setProductName(cell.ProductName);
      setQuantity(cell.Quantity);
    }
  };

  return (
    <div className="p-4">
      {compartments.map((comp, compIndex) => (
        <div key={comp} className="mb-4">
          {/* Header của mỗi khoang */}
          {compIndex === 0 && (
            <div className="flex space-x-2 mb-1">
              {/* <div className="w-16" /> */}
              <Button
                type="primary"
                className="w-28 h-10"
                onClick={() => exportToExcel(data)}
              >
                Xuất Excel
              </Button>
              {["A", "B", "C"].map((area) => (
                <div
                  key={`header-${comp}-${area}`}
                  className="w-20 text-center font-bold border rounded bg-gray-200 py-2"
                >
                  Dãy {area}
                </div>
              ))}
              <div className="w-10 flex items-center justify-center border rounded font-medium"></div>
              {["D", "E", "F", "G", "H", "I"].map((area) => (
                <div
                  key={`header-${comp}-${area}`}
                  className="w-20 text-center font-bold border rounded bg-gray-200 py-2"
                >
                  Dãy {area}
                </div>
              ))}
              <div className="w-10  flex items-center justify-center border rounded font-medium"></div>
              {["J", "K", "L", "M"].map((area) => (
                <div
                  key={`header-${comp}-${area}`}
                  className="w-20 text-center font-bold border rounded bg-gray-200 py-2"
                >
                  Dãy {area}
                </div>
              ))}
            </div>
          )}
          <div className="flex">
            {/* Tên khoang */}
            <div className="w-16 h-64 flex justify-center items-center text-center font-bold text-black bg-yellow-100 border rounded">
              Khoang {comp}
            </div>

            {/* Các hàng */}
            <div className="flex flex-col space-y-2 ml-2">
              {rows.map((row) => (
                <div key={row} className="flex items-center space-x-2">
                  {/* Row number */}
                  <div className="w-10 h-20 flex items-center justify-center border rounded font-medium">
                    {row}
                  </div>
                  {/* Các ô dữ liệu */}
                  {["A", "B", "C"].map((area) => {
                    const cell = data.find(
                      (d) =>
                        d.Area === area &&
                        d.Compartment === comp &&
                        d.RowNumber === row
                    );

                    return (
                      <div
                        key={`cell-${area}-${comp}-${row}`}
                        onClick={() => handleCellClick(area, comp, row)}
                        className={`w-20 h-20 p-2 border rounded text-sm flex flex-col justify-center items-center cursor-pointer ${
                          cell?.Quantity && cell.Quantity >= 0
                            ? "bg-blue-100 hover:bg-blue-200"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {cell?.Quantity && cell.Quantity >= 0 ? (
                          <>
                            {/* <div className="font-bold">{cell.Code}</div> */}
                            <div className="text-xs">{cell.ProductName}</div>
                            <div className="font-bold text-gray-600">
                              SL: {cell.Quantity}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 font-medium">Trống</div>
                        )}
                      </div>
                    );
                  })}
                  <div className="w-10 h-20 flex items-center justify-center border rounded font-medium">
                    {/* <div className="">
                      <div
                        style={{
                          width: "2px",
                          height: "20px",
                          backgroundColor: "#000000",
                          justifySelf: "center",
                          marginTop: "-2px",
                        }}
                      />
                      <div
                        style={{
                          width: "0px",
                          height: "0px",
                          borderLeft: "10px solid transparent",
                          borderRight: "10px solid transparent",
                          borderTop: "20px solid #000000",
                        }}
                      />
                    </div> */}
                  </div>
                  {["D", "E", "F", "G", "H", "I"].map((area) => {
                    const cell = data.find(
                      (d) =>
                        d.Area === area &&
                        d.Compartment === comp &&
                        d.RowNumber === row
                    );

                    return (
                      <div
                        key={`cell-${area}-${comp}-${row}`}
                        onClick={() => handleCellClick(area, comp, row)}
                        className={`w-20 h-20 p-2 border rounded text-sm flex flex-col justify-center items-center cursor-pointer ${
                          cell?.Quantity && cell.Quantity >= 0
                            ? "bg-blue-100 hover:bg-blue-200"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {cell?.Quantity && cell.Quantity >= 0 ? (
                          <>
                            {/* <div className="font-bold">{cell.Code}</div> */}
                            <div className="text-xs">{cell.ProductName}</div>
                            <div className="font-bold text-gray-600">
                              SL: {cell.Quantity}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 font-medium">Trống</div>
                        )}
                      </div>
                    );
                  })}
                  <div className="w-10 h-20 flex items-center justify-center border rounded font-medium"></div>
                  {["J", "K", "L", "M"].map((area) => {
                    const cell = data.find(
                      (d) =>
                        d.Area === area &&
                        d.Compartment === comp &&
                        d.RowNumber === row
                    );

                    return (
                      <div
                        key={`cell-${area}-${comp}-${row}`}
                        onClick={() => handleCellClick(area, comp, row)}
                        className={`w-20 h-20 p-2 border rounded text-sm flex flex-col justify-center items-center cursor-pointer ${
                          cell?.Quantity && cell.Quantity >= 0
                            ? "bg-blue-100 hover:bg-blue-200"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {cell?.Quantity && cell.Quantity >= 0 ? (
                          <>
                            {/* <div className="font-bold">{cell.Code}</div> */}
                            <div className="text-xs">{cell.ProductName}</div>
                            <div className="font-bold text-gray-600">
                              SL: {cell.Quantity}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-500 font-medium">Trống</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {compIndex === compartments.length - 1 && (
            <div className="flex space-x-2 mb-1 mt-1">
              <div className="w-16" /> {/* Spacer cho khoang */}
              <div className="w-10" /> {/* Spacer cho row number */}
              {["A", "B", "C"].map((area) => (
                <div
                  key={`header-${comp}-${area}`}
                  className="w-20 text-center font-bold border rounded bg-gray-200 py-2"
                >
                  Dãy {area}
                </div>
              ))}
              <div className="w-10 flex items-center justify-center border rounded font-medium">
                <DoorOpen className="w-6 h-6 text-gray-600" />
              </div>
              {["D", "E", "F", "G", "H", "I"].map((area) => (
                <div
                  key={`header-${comp}-${area}`}
                  className="w-20 text-center font-bold border rounded bg-gray-200 py-2"
                >
                  Dãy {area}
                </div>
              ))}
              <div className="w-10 flex items-center justify-center border rounded font-medium">
                <DoorOpen className="w-6 h-6 text-gray-600" />
              </div>
              {["J", "K", "L", "M"].map((area) => (
                <div
                  key={`header-${comp}-${area}`}
                  className="w-20 text-center font-bold border rounded bg-gray-200 py-2"
                >
                  Dãy {area}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <Drawer
        title={`Thông tin vị trí: ${selectedCell?.Area}0${selectedCell?.Comp}${selectedCell?.Row}`}
        placement="right"
        width={400}
        onClose={() => setSelectedCell(null)}
        open={!!selectedCell}
      >
        {selectedCell && (
          <>
            {(() => {
              const cell = data.find(
                (d) =>
                  d.Area === selectedCell.Area &&
                  d.Compartment === selectedCell.Comp &&
                  d.RowNumber === selectedCell.Row
              );
              return cell ? (
                <>
                  <Form layout="vertical">
                    <Form.Item label="Mã">
                      <Input value={cell.Code} readOnly />
                    </Form.Item>
                    <Form.Item label="Tên sản phẩm">
                      <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                      />
                    </Form.Item>
                    <Form.Item label="Số lượng">
                      <Input value={cell.Quantity} readOnly />
                    </Form.Item>
                    <Form.Item label="Cập nhật">
                      <Input
                        value={dayjs(cell.LastUpdated).format(
                          "DD/MM/YYYY | HH:mm"
                        )}
                        readOnly
                      />
                    </Form.Item>
                    <Form.Item label="Nhập số lượng">
                      <Input
                        type="number"
                        value={quantityChange}
                        onChange={(e) =>
                          setQuantityChange(Number(e.target.value))
                        }
                        placeholder="Nhập số lượng"
                        min={1}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Popconfirm
                          title="Bạn có chắc chắn muốn xóa?"
                          onConfirm={() => handleQuantityChange("reset")}
                          okText="Có"
                          cancelText="Không"
                        >
                          <Button type="primary" danger>
                            Xóa
                          </Button>
                        </Popconfirm>
                        <Button
                          type="primary"
                          onClick={() => handleQuantityChange("decrease")}
                        >
                          Xuất
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => handleQuantityChange("increase")}
                        >
                          Nhập
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </>
              ) : (
                <p>Vị trí này đang trống.</p>
              );
            })()}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default StorageLayout;
