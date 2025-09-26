import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import apiConfig from "../apiConfig.json";
import ConfirmButton from "./ConfirmButton";
// Define types for the application
interface WarehousePosition {
  Area: string;
  RowNumber: number;
  ProductName: string;
  Quantity: number;
}

interface CellData {
  productName: string;
  quantity: number;
}

interface LayoutData {
  [key: string]: CellData[];
}

interface SelectedCell {
  row: string;
  col: number;
}

interface AreaBlockProps {
  areas: string[];
}

export default function LayoutKho() {
  const [layout, setLayout] = useState<LayoutData>({});
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [productName, setProductName] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [quantityChange, setQuantityChange] = useState<number | string>(0);

  useEffect(() => {
    fetch(`${apiConfig.API_BASE_URL}/api/B9/warehousepositions`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi gọi API");
        }
        return response.json();
      })
      .then((data: WarehousePosition[]) => {
        console.log("Dữ liệu từ API:", data);
        const newLayout: LayoutData = {};
        const areas: string[] = "ABCDEFGHIJKLM".split("");

        // Tạo mảng rỗng cho từng khu
        areas.forEach((area) => {
          newLayout[area] = Array(24).fill(null); // 24 vị trí
        });

        // Đưa dữ liệu vào layout
        data.forEach((item) => {
          const area = item.Area;
          const index = item.RowNumber - 1;
          newLayout[area][index] = {
            productName: item.ProductName,
            quantity: item.Quantity,
          };
        });

        setLayout(newLayout);
      })
      .catch((error) => {
        console.error("Lỗi khi tải dữ liệu:", error);
      });
  }, []);

  // Nếu layout chưa sẵn sàng
  if (Object.keys(layout).length === 0) {
    return <div className="p-4">Không thể tải dữ liệu kho...</div>;
  }

  const handleCellClick = (row: string, col: number): void => {
    setSelected({ row, col });
    const cellData = layout[row][col];
    setProductName(cellData?.productName || "");
    setQuantity(cellData?.quantity || 0);
  };

  const handleQuantityChange = (
    operation: "increase" | "decrease" | "reset"
  ): void => {
    if (!selected) return;

    const newLayout = { ...layout };
    const currentQuantity =
      newLayout[selected.row][selected.col]?.quantity || 0;

    let newQuantity = currentQuantity;
    const changeValue =
      typeof quantityChange === "string"
        ? parseInt(quantityChange)
        : quantityChange;

    if (isNaN(changeValue)) {
      alert("Vui lòng nhập số lượng hợp lệ (>= 1).");
      return;
    }

    // Thực hiện cộng hoặc trừ số lượng
    if (operation === "increase") {
      newQuantity = currentQuantity + changeValue;
    } else if (operation === "decrease") {
      if (currentQuantity - changeValue < 0) {
        alert("Số lượng không đủ để xuất kho.");
        return;
      }
      newQuantity = currentQuantity - changeValue;
    }

    // Cập nhật lại dữ liệu layout
    newLayout[selected.row][selected.col] = {
      productName,
      quantity: newQuantity,
    };
    if (operation === "reset") {
      newLayout[selected.row][selected.col] = {
        productName: "",
        quantity: 0,
      };
      setProductName("");
      setQuantity(0);
    } else {
      setQuantity(newQuantity);
    }
    // Lưu dữ liệu cần gửi đến API
    const savelayout: WarehousePosition[] = [
      {
        Area: selected.row,
        RowNumber: selected.col + 1,
        ProductName: newLayout[selected.row][selected.col].productName,
        Quantity: newLayout[selected.row][selected.col].quantity,
      },
    ];

    console.log("Dữ liệu cần lưu:", savelayout);

    fetch(`${apiConfig.API_BASE_URL}/api/B9/savelayout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(savelayout),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi lưu dữ liệu");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Dữ liệu đã được lưu thành công:", data);
        // alert("Lưu thành công!");
      })
      .catch((error) => {
        console.log("Lỗi khi lưu layout:", error);
        alert("Lưu thất bại!");
      });

    setLayout(newLayout);
    // setSelected(null);
  };

  const handleAddRow = (colKey: string, rowIndex: number): void => {
    const newLayout = { ...layout };
    newLayout[colKey][rowIndex] = {
      productName: "",
      quantity: 0,
    };

    const savelayout: WarehousePosition[] = [
      {
        Area: colKey,
        RowNumber: rowIndex + 1,
        ProductName: "",
        Quantity: 0,
      },
    ];

    fetch(`${apiConfig.API_BASE_URL}/api/B9/savelayout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(savelayout),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi lưu dữ liệu");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Dữ liệu đã được lưu thành công:", data);
        // alert("Lưu thành công!");
      })
      .catch((error) => {
        console.log("Lỗi khi lưu layout:", error);
        alert("Lưu thất bại!");
      });

    console.log("Thêm hàng mới:", newLayout);
    setLayout(newLayout);
  };

  const AreaBlock: React.FC<AreaBlockProps> = ({ areas }) => (
    <div className="flex space-x-1">
      {areas.map((colKey) => (
        <div key={colKey} className="space-y-1">
          <div className="text-center font-bold mb-1 border rounded p-2 h-10 w-24 flex items-center justify-center text-sm">
            Dãy {colKey}
          </div>
          {layout[colKey].map((cell, rowIndex) => (
            <div
              key={rowIndex}
              onClick={() => handleCellClick(colKey, rowIndex)}
              className={`border rounded p-2 h-20 w-24 flex items-center justify-center text-sm cursor-pointer ${
                cell?.quantity > 0
                  ? "bg-blue-100 hover:bg-blue-200"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {cell?.quantity > 0 ? (
                <div>
                  <div className="font-medium">{cell.productName}</div>
                  <div>SL: {cell.quantity}</div>
                </div>
              ) : (
                "Trống"
              )}
            </div>
          ))}
          {/* <div
            onClick={() => handleAddRow(colKey, layout[colKey].length)}
            className="border rounded p-2 h-20 w-24 flex items-center justify-center cursor-pointer text-xl font-bold bg-green-100 hover:bg-green-200"
          >
            +
          </div> */}
        </div>
      ))}
    </div>
  );

  const maxLength = Math.max(...Object.values(layout).map((arr) => arr.length));

  return (
    <div className="p-4 overflow-x-auto">
      {/* Thẻ cha với display flex */}
      <div className="flex space-x-8">
        {/* Khu vực A, B, C */}
        <div className="flex space-x-2">
          <div className="space-y-1">
            <div className="text-center font-bold mb-1 border rounded p-2 h-10 w-12 flex items-center justify-center cursor-pointer text-sm">
              {" "}
            </div>
            {/* Create columns dynamically based on maxLength */}
            {Array.from({ length: maxLength }).map((_, groupIndex) => (
              <div key={groupIndex} className="flex flex-row items-stretch">
                {/* Ô Khoang */}
                {/* <div className="border rounded h-62 w-20 flex items-center justify-center font-semibold bg-yellow-100">
                  Khoang {groupIndex + 1}
                </div> */}

                {/* 3 ô số theo chiều dọc */}
                <div className="flex flex-col space-y-1">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const rowIndex = groupIndex * 3 + i;
                    if (rowIndex >= maxLength) return null;
                    return (
                      <div
                        key={rowIndex}
                        className="border rounded p-2 h-20 w-12 flex items-center justify-center cursor-pointer text-sm text-center"
                      >
                        {rowIndex + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AreaBlock areas={["A", "B", "C"]} />
        {/* Khu vực D, E, F, G */}
        <AreaBlock areas={["D", "E", "F", "G", "H", "I"]} />

        <AreaBlock areas={["J", "K", "L", "M"]} />
      </div>

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 p-6 overflow-y-auto transition-transform duration-300 transform ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            Cập nhật vị trí {selected?.row} - {(selected?.col ?? 0) + 1}
          </h2>
          <button
            onClick={() => setSelected(null)}
            className="text-gray-500 hover:text-red-600 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="productName"
              className="block text-sm font-medium text-gray-700"
            >
              Tên sản phẩm
            </label>
            <input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Tên sản phẩm"
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700"
            >
              Số lượng
            </label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="Số lượng"
              className="w-full border p-2 rounded"
              disabled
              min={1}
            />
          </div>

          <div>
            <label
              htmlFor="quantityChange"
              className="block text-sm font-medium text-gray-700"
            >
              Nhập xuất kho
            </label>
            <input
              id="quantityChange"
              type="number"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              placeholder="Số lượng nhập xuất"
              className="w-full border p-2 rounded"
              required
              min={1}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <ConfirmButton onConfirm={() => handleQuantityChange("reset")}>
              <button className="px-4 py-2 bg-red-500 text-white rounded">
                Xóa
              </button>
            </ConfirmButton>

            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuantityChange("");
              }}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleQuantityChange("decrease")}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Xuất
            </button>
            <button
              type="button"
              onClick={() => handleQuantityChange("increase")}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
