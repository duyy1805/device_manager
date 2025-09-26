import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Modal, Input, Button, List, Empty } from "antd";

type Side = "L" | "R";

interface SeatDto {
  SeatId: number;
  SeatCode: string;
  Side: Side;
  RowNumber: number;
  ColNumber: number;
  PersonName?: string | null;
}

interface Props {
  eventId: number;
  apiBase?: string;
  rows?: number;
  colsPerSide?: number;
  /** Kích thước cell mặc định cho desktop, mobile sẽ auto scale */
  cellSize?: number;
}

const SeatCell: React.FC<{
  text?: string;
  size: number;
  bg?: string;
  domId?: string;
  isHighlighted?: boolean;
  onClick?: () => void;
}> = ({ text, size, bg, domId, isHighlighted, onClick }) => (
  <div
    id={domId}
    className={`border text-[10px] sm:text-xs md:text-sm flex items-center justify-center text-center p-1 select-none hover:shadow cursor-pointer ${
      isHighlighted ? "blink-border" : ""
    }`}
    style={{ width: size, height: size, backgroundColor: bg || "white" }}
    title={text}
    onClick={onClick}
  >
    <span className="line-clamp-3 leading-tight">{text || "Trống"}</span>
  </div>
);

const IndexCell: React.FC<{ value: string | number; w: number; h: number }> = ({
  value,
  w,
  h,
}) => (
  <div
    className="border flex items-center justify-center font-semibold text-xs"
    style={{ width: w, height: h }}
  >
    {value}
  </div>
);

// Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
const stripVN = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tổ hợp
    .toLowerCase()
    .trim();

const SeatingChartHallLikeImage: React.FC<Props> = ({
  eventId,
  apiBase = "http://localhost:5000/hoitruong",
  rows = 11,
  colsPerSide = 10,
  cellSize = 78,
}) => {
  const [seats, setSeats] = useState<SeatDto[]>([]);
  const [loading, setLoading] = useState(false);

  // ====== ADMIN: sửa tên ======
  const [editing, setEditing] = useState<SeatDto | null>(null);
  const [newName, setNewName] = useState<string>("");

  const openEdit = (seat: SeatDto) => {
    setEditing(seat);
    setNewName(seat.PersonName || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const res = await axios.post(`${apiBase}/eventseat/upsert`, {
        EventId: eventId,
        SeatId: editing.SeatId,
        PersonName: newName || null,
      });

      const updated: SeatDto | undefined = res.data?.data;
      if (updated) {
        setSeats((prev) =>
          prev.map((s) =>
            s.SeatId === updated.SeatId
              ? { ...s, PersonName: updated.PersonName ?? null }
              : s
          )
        );
      } else {
        setSeats((prev) =>
          prev.map((s) =>
            s.SeatId === editing.SeatId
              ? { ...s, PersonName: newName || null }
              : s
          )
        );
      }
      setEditing(null);
    } catch (e) {
      console.error("saveEdit error:", e);
      // eslint-disable-next-line no-alert
      alert("Lưu thất bại!");
    }
  };

  // ====== GUEST: tìm chỗ của tôi ======
  const [findOpen, setFindOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SeatDto[]>([]);
  const [highlightSeatId, setHighlightSeatId] = useState<number | null>(null);
  const highlightTimer = useRef<number | null>(null);

  const openFind = () => {
    setQuery("");
    setResults([]);
    setFindOpen(true);
  };

  const handleSearch = (val: string) => {
    setQuery(val);
    const q = stripVN(val);
    if (!q) {
      setResults([]);
      return;
    }
    const matched = seats.filter(
      (s) => s.PersonName && stripVN(s.PersonName).includes(q)
    );
    setResults(matched);
  };

  // ====== Scroll tách trục: outer (dọc), inner (ngang) ======
  const outerRef = useRef<HTMLDivElement | null>(null); // cuộn dọc
  const innerXRef = useRef<HTMLDivElement | null>(null); // cuộn ngang (chứa sơ đồ)

  const focusSeat = (seat: SeatDto) => {
    setFindOpen(false);
    setHighlightSeatId(seat.SeatId);

    const el = document.getElementById(`seat-${seat.SeatId}`);
    const outer = outerRef.current;
    const inner = innerXRef.current;

    if (el && outer && inner) {
      const elRect = el.getBoundingClientRect();
      const innerRect = inner.getBoundingClientRect();
      const outerRect = outer.getBoundingClientRect();

      // Tính scroll ngang trong inner (only X)
      const offsetLeftInInner = elRect.left - innerRect.left + inner.scrollLeft;
      inner.scrollTo({
        left: Math.max(
          0,
          offsetLeftInInner - inner.clientWidth / 2 + el.clientWidth / 2
        ),
        behavior: "smooth",
      });

      // Tính scroll dọc trong outer (only Y)
      const offsetTopInOuter = elRect.top - outerRect.top + outer.scrollTop;
      outer.scrollTo({
        top: Math.max(
          0,
          offsetTopInOuter - outer.clientHeight / 2 + el.clientHeight / 2
        ),
        behavior: "smooth",
      });
    } else if (el?.scrollIntoView) {
      // fallback
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }

    if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(
      () => setHighlightSeatId(null),
      10000
    );
  };

  // ====== Responsive cellSize ======
  const [cellSizePx, setCellSizePx] = useState<number>(cellSize);

  const calcCellSize = () => {
    if (typeof window === "undefined") return cellSize;
    const w = window.innerWidth;
    if (w < 380) return 44; // rất nhỏ
    if (w < 640) return 52; // sm
    if (w < 1024) return 64; // md
    return cellSize; // desktop
  };

  useEffect(() => {
    const handler = () => setCellSizePx(calcCellSize());
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize]);

  // ====== Fetch seats ======
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.post(`${apiBase}/eventseat`, {
          EventId: eventId,
        });
        const list: SeatDto[] = res.data?.data || [];
        if (mounted) setSeats(list);
      } catch (e) {
        console.error("Fetch eventseat error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    };
  }, [apiBase, eventId]);

  const leftSeats = useMemo(() => seats.filter((s) => s.Side === "L"), [seats]);
  const rightSeats = useMemo(
    () => seats.filter((s) => s.Side === "R"),
    [seats]
  );

  const renderWing = (wingSeats: SeatDto[], sideLabel: Side) => {
    const isRight = sideLabel === "R";
    const idxW = Math.max(22, Math.floor(cellSizePx / 3));
    const idxH = cellSizePx;
    const bottomH = Math.max(20, Math.floor(cellSizePx / 3));

    const RowIndexCell = (r: number) => (
      <IndexCell value={r + 1} w={idxW} h={idxH} />
    );
    const BlankIndexCell = () => <IndexCell value={""} w={idxW} h={bottomH} />;

    return (
      <div className="flex flex-col items-start">
        <div className="flex flex-col gap-1">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex items-center gap-1">
              {!isRight && RowIndexCell(r)}
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${colsPerSide}, ${cellSizePx}px)`,
                }}
              >
                {Array.from({ length: colsPerSide }, (_, c) => {
                  const seat = wingSeats.find(
                    (s) => s.RowNumber === r + 1 && s.ColNumber === c + 1
                  );
                  const bg = r < 2 ? "#ffe082" : undefined; // 2 hàng đầu tô màu
                  const isHL = seat && seat.SeatId === highlightSeatId;
                  return (
                    <SeatCell
                      key={`${sideLabel}-${r}-${c}`}
                      domId={seat ? `seat-${seat.SeatId}` : undefined}
                      text={seat?.PersonName || ""}
                      size={cellSizePx}
                      bg={bg}
                      isHighlighted={!!isHL}
                      onClick={() => seat && openEdit(seat)} // admin: click để sửa
                    />
                  );
                })}
              </div>
              {isRight && RowIndexCell(r)}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 mt-1">
          {!isRight && <BlankIndexCell />}
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${colsPerSide}, ${cellSizePx}px)`,
            }}
          >
            {Array.from({ length: colsPerSide }, (_, i) => (
              <IndexCell
                key={`col-${sideLabel}-${i}`}
                value={i + 1}
                w={cellSizePx}
                h={bottomH}
              />
            ))}
          </div>
          {isRight && <BlankIndexCell />}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={outerRef}
      className="w-full h-full max-h-[100dvh] flex flex-col overflow-y-auto overflow-x-hidden"
    >
      {/* CSS hiệu ứng nhấp nháy viền */}
      <style>{`
        @keyframes blink {
          0% { box-shadow: 0 0 0 0 rgba(255,0,0,0.9); border-color: #ff0000; }
          50% { box-shadow: 0 0 0 4px rgba(255,0,0,0.2); border-color: #ff0000; }
          100% { box-shadow: 0 0 0 0 rgba(255,0,0,0); border-color: #ff0000; }
        }
        .blink-border { animation: blink 0.8s ease-in-out infinite; }
      `}</style>

      {/* Header sticky: đứng yên khi kéo ngang vì header KHÔNG ở trong vùng overflow-x */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-center flex-1">
            <div className="text-red-600 font-extrabold text-xl sm:text-2xl">
              SƠ ĐỒ VỊ TRÍ NGỒI
            </div>
            <div className="text-red-600 font-extrabold text-sm sm:text-lg">
              CỦA ĐẠI BIỂU DỰ ĐẠI HỘI …
            </div>
          </div>
          <Button type="primary" onClick={openFind}>
            Tìm chỗ của tôi
          </Button>
        </div>
      </div>

      {/* Nội dung: scroll dọc theo outer, scroll ngang theo inner */}
      <div className="px-4 pb-4">
        {loading && (
          <div className="text-center text-sm text-gray-500">
            Đang tải dữ liệu…
          </div>
        )}

        {/* Vùng cuộn ngang chỉ bao lưới ghế */}
        <div ref={innerXRef} className="overflow-x-auto">
          <div className="flex items-start gap-6 py-4 min-w-max">
            {/* Cánh Trái */}
            {renderWing(leftSeats, "L")}

            {/* Lối đi giữa */}
            <div className="flex flex-col items-center pt-10">
              <div className="w-1 h-full bg-gray-500" />
              <div className="text-xs text-gray-500 mt-2">LỐI ĐI</div>
            </div>

            {/* Cánh Phải */}
            {renderWing(rightSeats, "R")}
          </div>
        </div>
      </div>

      {/* Modal ADMIN sửa tên */}
      <Modal
        title={`Sửa tên - ${editing?.SeatCode || ""}`}
        open={!!editing}
        onOk={saveEdit}
        onCancel={() => setEditing(null)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        width="100%"
        style={{ top: 16 }}
      >
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            Vị trí: {editing?.Side}-{editing?.RowNumber}-{editing?.ColNumber}
          </div>
          <Input
            placeholder="Nhập tên người tham dự (để trống = ghế trống)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            allowClear
          />
        </div>
      </Modal>

      {/* Modal GUEST tìm tên */}
      <Modal
        title="Tìm chỗ của tôi"
        open={findOpen}
        onCancel={() => setFindOpen(false)}
        footer={null}
        destroyOnClose
        width="100%"
        style={{ top: 16 }}
      >
        <Input
          placeholder="Nhập tên (không phân biệt dấu)"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
        <div className="mt-3" />
        {results.length === 0 ? (
          query ? (
            <Empty description="Không tìm thấy" />
          ) : (
            <div className="text-xs text-gray-500">Nhập tên để tìm…</div>
          )
        ) : (
          <List
            size="small"
            bordered
            dataSource={results.slice(0, 50)} // giới hạn để đỡ dài
            renderItem={(item) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => focusSeat(item)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.PersonName}</span>
                  <span className="text-xs text-gray-500">
                    Vị trí: {item.SeatCode} (Bên{" "}
                    {item.Side === "L" ? "Trái" : "Phải"}, Hàng {item.RowNumber}
                    , Cột {item.ColNumber})
                  </span>
                </div>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default SeatingChartHallLikeImage;
