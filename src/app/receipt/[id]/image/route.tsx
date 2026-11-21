import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DESTINATION_LABEL, type Destination } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { getReceipt } from "@/lib/receipt";

const fontDir = join(process.cwd(), "node_modules/geist/dist/fonts");

/** 1080×1350 portrait card — fits an Instagram/TikTok photo post. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getReceipt(id);
  if (!r) return new Response("Not found", { status: 404 });

  const [mono, monoBold, sans] = await Promise.all([
    readFile(join(fontDir, "geist-mono/GeistMono-Regular.ttf")),
    readFile(join(fontDir, "geist-mono/GeistMono-SemiBold.ttf")),
    readFile(join(fontDir, "geist-sans/Geist-SemiBold.ttf")),
  ]);

  const line = { display: "flex", justifyContent: "space-between", fontSize: 36, marginTop: 18 } as const;
  const rule = { borderTop: "3px dashed rgba(20,20,19,0.25)", marginTop: 40, marginBottom: 22, width: "100%" } as const;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#ece8dc", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 820,
            background: "#fbfaf6",
            border: "2px solid #dcd7c9",
            borderRadius: 28,
            padding: "64px 64px 72px",
            fontFamily: "GeistMono",
            color: "#141413",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", fontFamily: "Geist", fontSize: 44 }}>
              <div style={{ display: "flex", width: 56, height: 56, borderRadius: 12, background: "#141413", color: "#f4f1e8", alignItems: "center", justifyContent: "center", fontFamily: "GeistMono", fontSize: 34, marginRight: 14 }}>#</div>
              Caught
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#6f6c63" }}>@{r.creator.handle}</div>
          </div>
          <div style={rule} />
          <div style={line}><span style={{ color: "#6f6c63" }}>Item</span><span>#{r.productNumber}</span></div>
          <div style={{ display: "flex", justifyContent: "flex-end", fontFamily: "Geist", fontSize: 30, marginTop: 8, color: "#3d3c38" }}>
            {r.productName.length > 36 ? r.productName.slice(0, 36) + "…" : r.productName}
          </div>
          <div style={line}><span style={{ color: "#6f6c63" }}>Bought on</span><span>{DESTINATION_LABEL[r.destination as Destination]}</span></div>
          <div style={line}><span style={{ color: "#6f6c63" }}>Order</span><span>{formatPrice(r.amountCents)}</span></div>
          <div style={rule} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 56, fontWeight: 600 }}>
            <span>Caught</span>
            <span style={{ color: "#157a48" }}>{formatPrice(r.commissionCents)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 64, fontFamily: "Geist", fontSize: 24, letterSpacing: 8, color: "#9c988c" }}>
            NOTHING SLIPS
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: "GeistMono", data: mono, weight: 400 },
        { name: "GeistMono", data: monoBold, weight: 600 },
        { name: "Geist", data: sans, weight: 600 },
      ],
    },
  );
}
