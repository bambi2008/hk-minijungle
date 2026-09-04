from __future__ import annotations

import math
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PKG = ROOT / "AquaClick_V0.1C"
DXF_DIR = PKG / "drawings" / "dxf"
ZIP_PATH = ROOT / "output" / "AquaClick_Digital_Engineering_Package_V0.1C.zip"


class DXF:
    def __init__(self) -> None:
        self.entities: list[str] = []
        self.layers = {
            "BORDER": 7,
            "TITLE": 7,
            "VISIBLE": 7,
            "HIDDEN": 8,
            "CENTER": 5,
            "DIM": 2,
            "TEXT": 7,
            "SECTION": 3,
            "WET": 4,
            "DRY": 6,
            "MAGNET": 1,
            "LOCK": 30,
            "SEAL": 1,
        }

    @staticmethod
    def pair(code: int, value: str | int | float) -> str:
        return f"{code}\n{value}\n"

    def add(self, entity: str) -> None:
        self.entities.append(entity)

    def line(self, x1: float, y1: float, x2: float, y2: float, layer: str = "VISIBLE") -> None:
        self.add(
            "0\nLINE\n"
            + self.pair(8, layer)
            + self.pair(10, f"{x1:.3f}")
            + self.pair(20, f"{y1:.3f}")
            + self.pair(30, "0.0")
            + self.pair(11, f"{x2:.3f}")
            + self.pair(21, f"{y2:.3f}")
            + self.pair(31, "0.0")
        )

    def rect(self, x: float, y: float, w: float, h: float, layer: str = "VISIBLE") -> None:
        self.line(x, y, x + w, y, layer)
        self.line(x + w, y, x + w, y + h, layer)
        self.line(x + w, y + h, x, y + h, layer)
        self.line(x, y + h, x, y, layer)

    def circle(self, x: float, y: float, r: float, layer: str = "VISIBLE") -> None:
        self.add(
            "0\nCIRCLE\n"
            + self.pair(8, layer)
            + self.pair(10, f"{x:.3f}")
            + self.pair(20, f"{y:.3f}")
            + self.pair(30, "0.0")
            + self.pair(40, f"{r:.3f}")
        )

    def arc(self, x: float, y: float, r: float, start: float, end: float, layer: str = "VISIBLE") -> None:
        self.add(
            "0\nARC\n"
            + self.pair(8, layer)
            + self.pair(10, f"{x:.3f}")
            + self.pair(20, f"{y:.3f}")
            + self.pair(30, "0.0")
            + self.pair(40, f"{r:.3f}")
            + self.pair(50, f"{start:.3f}")
            + self.pair(51, f"{end:.3f}")
        )

    def text(
        self,
        x: float,
        y: float,
        value: str,
        height: float = 5.0,
        layer: str = "TEXT",
        rotation: float = 0,
        align: str = "L",
    ) -> None:
        # ASCII only: keep DXF robust in older AutoCAD.
        value = value.encode("ascii", "replace").decode("ascii")
        entity = (
            "0\nTEXT\n"
            + self.pair(8, layer)
            + self.pair(10, f"{x:.3f}")
            + self.pair(20, f"{y:.3f}")
            + self.pair(30, "0.0")
            + self.pair(40, f"{height:.3f}")
            + self.pair(1, value)
            + self.pair(50, f"{rotation:.3f}")
        )
        if align == "C":
            entity += self.pair(72, 1) + self.pair(11, f"{x:.3f}") + self.pair(21, f"{y:.3f}") + self.pair(31, "0.0")
        self.add(entity)

    def polyline(self, points: list[tuple[float, float]], layer: str = "VISIBLE", closed: bool = False) -> None:
        for a, b in zip(points, points[1:]):
            self.line(a[0], a[1], b[0], b[1], layer)
        if closed and len(points) > 2:
            self.line(points[-1][0], points[-1][1], points[0][0], points[0][1], layer)

    def hatch_lines(self, x: float, y: float, w: float, h: float, spacing: float = 8, layer: str = "SECTION") -> None:
        i = -h
        while i < w:
            x1 = max(x, x + i)
            y1 = y + max(0, -i)
            x2 = min(x + w, x + i + h)
            y2 = y + min(h, w - i)
            self.line(x1, y1, x2, y2, layer)
            i += spacing

    def arrow(self, x: float, y: float, angle_deg: float, size: float = 4, layer: str = "DIM") -> None:
        a = math.radians(angle_deg)
        left = a + math.radians(150)
        right = a - math.radians(150)
        self.line(x, y, x + size * math.cos(left), y + size * math.sin(left), layer)
        self.line(x, y, x + size * math.cos(right), y + size * math.sin(right), layer)

    def dim_h(self, x1: float, x2: float, y: float, label: str, layer: str = "DIM") -> None:
        self.line(x1, y, x2, y, layer)
        self.arrow(x1, y, 0, layer=layer)
        self.arrow(x2, y, 180, layer=layer)
        self.text((x1 + x2) / 2, y + 4, label, 4, layer, align="C")

    def dim_v(self, x: float, y1: float, y2: float, label: str, layer: str = "DIM") -> None:
        self.line(x, y1, x, y2, layer)
        self.arrow(x, y1, 90, layer=layer)
        self.arrow(x, y2, 270, layer=layer)
        self.text(x + 4, (y1 + y2) / 2, label, 4, layer, rotation=90)

    def leader(self, x1: float, y1: float, x2: float, y2: float, label: str, layer: str = "DIM") -> None:
        self.line(x1, y1, x2, y2, layer)
        self.arrow(x1, y1, math.degrees(math.atan2(y1 - y2, x1 - x2)), layer=layer)
        self.text(x2 + 3, y2 + 1, label, 4, "TEXT")

    def sheet(self, title: str, drawing_no: str, rev: str = "V0.2") -> None:
        self.rect(0, 0, 420, 297, "BORDER")
        self.rect(10, 10, 400, 277, "BORDER")
        self.rect(235, 10, 175, 38, "TITLE")
        self.line(235, 29, 410, 29, "TITLE")
        self.line(300, 10, 300, 48, "TITLE")
        self.line(350, 10, 350, 48, "TITLE")
        self.text(240, 37, "AquaClick Engineering Communication", 4, "TITLE")
        self.text(240, 22, title, 4, "TITLE")
        self.text(304, 22, drawing_no, 4, "TITLE")
        self.text(354, 22, rev, 4, "TITLE")
        self.text(240, 14, "Units: mm | Not for tooling | Validate by EVT/OEM", 3, "TITLE")

    def render(self) -> str:
        tables = "0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n12\n"
        for name, color in self.layers.items():
            tables += f"0\nLAYER\n2\n{name}\n70\n0\n62\n{color}\n6\nCONTINUOUS\n"
        tables += "0\nENDTAB\n0\nENDSEC\n"
        return "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n" + tables + "0\nSECTION\n2\nENTITIES\n" + "".join(self.entities) + "0\nENDSEC\n0\nEOF\n"


def draw_ga() -> DXF:
    d = DXF()
    d.sheet("GA Wet/Dry Section", "AQ-DXF-001")
    d.text(25, 268, "A-A SECTION: WASHABLE FOOD ASSEMBLY ABOVE DRY BASE", 5, "TEXT")
    d.polyline([(90, 240), (230, 240), (215, 135), (160, 82), (105, 135)], "WET", True)
    d.polyline([(112, 135), (170, 100), (207, 135)], "CENTER")
    d.circle(205, 126, 17, "VISIBLE")
    d.rect(125, 58, 165, 30, "DRY")
    d.rect(285, 145, 70, 55, "DRY")
    d.rect(265, 85, 80, 30, "WET")
    d.line(65, 90, 365, 90, "SEAL")
    d.text(268, 92, "WASH BOUNDARY", 4, "SEAL")
    d.hatch_lines(90, 240, 140, 12, 6, "SECTION")
    d.dim_h(90, 230, 255, "HOPPER OD 180/185")
    d.dim_v(372, 58, 240, "TARGET HEIGHT <=305")
    d.leader(205, 126, 255, 145, "removable rotor in wet zone")
    d.leader(180, 70, 290, 55, "motor/PCB remain dry")
    d.leader(285, 172, 358, 218, "dry smart module bay")
    d.text(25, 35, "KEY RULE: food-contact assembly is passive. No PCB, motor, battery, permanent wiring or camera in wet zone.", 3.5)
    return d


def draw_food_path() -> DXF:
    d = DXF()
    d.sheet("Washable Food Path Detail", "AQ-DXF-002")
    d.text(25, 268, "REMOVABLE FOOD-CONTACT PATH - DETAIL B", 5)
    d.polyline([(65, 230), (220, 230), (210, 135), (165, 98), (80, 132)], "WET", True)
    d.circle(212, 128, 22, "VISIBLE")
    d.rect(230, 112, 105, 24, "VISIBLE")
    d.rect(243, 119, 78, 10, "CENTER")
    d.rect(302, 75, 65, 32, "WET")
    d.hatch_lines(230, 112, 105, 24, 6, "SECTION")
    d.dim_h(230, 335, 150, "LINER LENGTH 82/88")
    d.dim_v(348, 112, 136, "INNER H 22/24")
    d.dim_h(243, 321, 103, "INNER W 24/30")
    d.leader(160, 168, 35, 160, "eccentric floor slopes to rotor")
    d.leader(212, 128, 250, 174, "mature wheel/rotor reference")
    d.leader(300, 132, 350, 166, "washable liner, draft 2 deg, R3+")
    d.leader(335, 91, 358, 120, "removable bowl/tray")
    d.text(25, 45, "No dishwasher-safe claim at this stage. Rinse/soak/hand-wash only until validated.", 3.5)
    return d


def draw_click() -> DXF:
    d = DXF()
    d.sheet("Click Interface Detail", "AQ-DXF-003")
    d.text(25, 268, "MAGNETIC ALIGNMENT + MECHANICAL LOCK + SEAL BOUNDARY", 5)
    d.rect(70, 108, 120, 105, "WET")
    d.rect(230, 108, 120, 105, "DRY")
    d.circle(185, 180, 8, "MAGNET")
    d.circle(235, 180, 8, "MAGNET")
    d.polyline([(184, 132), (213, 132), (224, 116), (195, 116)], "LOCK", True)
    d.polyline([(236, 132), (265, 132), (254, 116), (225, 116)], "LOCK", True)
    d.rect(190, 86, 70, 11, "SEAL")
    d.line(210, 92, 210, 230, "CENTER")
    d.leader(185, 180, 105, 235, "magnet locates only")
    d.leader(224, 124, 266, 215, "mechanical latch retains")
    d.leader(225, 91, 278, 72, "gasket/labyrinth")
    d.dim_h(70, 350, 238, "INTERFACE WIDTH TBD BY TEARDOWN")
    d.text(25, 55, "DESIGN INTENT: magnets must not be the safety lock. Lock retention and release force require bench test.", 3.5)
    return d


def draw_dry_base() -> DXF:
    d = DXF()
    d.sheet("Dry Base Envelope", "AQ-DXF-004")
    d.text(25, 268, "DRY BASE - COMPONENT ENVELOPE AND PROTECTED ZONES", 5)
    d.rect(55, 75, 300, 140, "DRY")
    d.circle(132, 155, 25, "VISIBLE")
    d.rect(205, 135, 85, 40, "VISIBLE")
    d.rect(110, 92, 160, 18, "LOCK")
    d.rect(305, 125, 28, 65, "WET")
    d.line(55, 218, 355, 218, "SEAL")
    d.leader(132, 155, 82, 235, "motor/gearbox")
    d.leader(250, 155, 292, 235, "PCB/power")
    d.leader(190, 101, 245, 62, "load-cell protected path")
    d.leader(320, 160, 345, 228, "dry module contacts")
    d.dim_h(55, 355, 235, "BASE FOOTPRINT TBD")
    d.text(25, 45, "Dry base is not washable. Design for dust exposure, splash boundary and assembly-present lockout.", 3.5)
    return d


def draw_prototype_plan() -> DXF:
    d = DXF()
    d.sheet("Dual Prototype Plan", "AQ-DXF-005")
    d.text(25, 268, "SPLIT PROTOTYPES BEFORE INTEGRATED EVT", 5)
    d.rect(45, 105, 145, 115, "WET")
    d.rect(230, 105, 145, 115, "DRY")
    d.text(60, 198, "PROTOTYPE A", 5)
    d.text(60, 185, "Engineering feeder mule", 4)
    d.text(60, 165, "1 mature feed mechanism", 3.5)
    d.text(60, 152, "2 washable wet assembly", 3.5)
    d.text(60, 139, "3 real food tests", 3.5)
    d.text(245, 198, "PROTOTYPE B", 5)
    d.text(245, 185, "Click experience model", 4)
    d.text(245, 165, "1 magnet alignment feel", 3.5)
    d.text(245, 152, "2 latch click / release", 3.5)
    d.text(245, 139, "3 module demo story", 3.5)
    d.line(190, 162, 230, 162, "DIM")
    d.arrow(230, 162, 180)
    d.text(148, 75, "INTEGRATE ONLY AFTER BOTH GATES PASS", 4.5, "TEXT")
    return d


def write_index(files: list[Path]) -> None:
    lines = [
        "# AquaClick V0.2 AutoCAD DXF Drawing Set",
        "",
        "These DXF files are engineering communication drawings for AutoCAD review. They are not production drawings, mold drawings or validated CAD.",
        "",
        "## Files",
        "",
    ]
    for file in files:
        lines.append(f"- `{file.name}`")
    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- Format: ASCII DXF R12 / AC1009 for broad AutoCAD compatibility.",
            "- Units: millimeters.",
            "- Layers include WET, DRY, SEAL, LOCK, MAGNET, DIM, CENTER and TEXT.",
            "- Chinese notes are intentionally avoided inside DXF to keep AutoCAD 2014 encoding reliable.",
        ]
    )
    (DXF_DIR / "DXF_DRAWING_INDEX_V0.2.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def update_zip() -> None:
    if not ZIP_PATH.exists():
        return
    existing: set[str] = set()
    with zipfile.ZipFile(ZIP_PATH, "a", zipfile.ZIP_DEFLATED) as z:
        existing = set(z.namelist())
        for file in DXF_DIR.rglob("*"):
            if file.is_file():
                arc = str(file.relative_to(ROOT)).replace("\\", "/")
                if arc not in existing:
                    z.write(file, arc)


def main() -> None:
    DXF_DIR.mkdir(parents=True, exist_ok=True)
    drawings = [
        ("AQ-DXF-001_GA_Wet_Dry_Section.dxf", draw_ga()),
        ("AQ-DXF-002_Washable_Food_Path_Detail.dxf", draw_food_path()),
        ("AQ-DXF-003_Click_Interface_Detail.dxf", draw_click()),
        ("AQ-DXF-004_Dry_Base_Envelope.dxf", draw_dry_base()),
        ("AQ-DXF-005_Dual_Prototype_Plan.dxf", draw_prototype_plan()),
    ]
    files: list[Path] = []
    for filename, drawing in drawings:
        path = DXF_DIR / filename
        path.write_text(drawing.render(), encoding="ascii")
        files.append(path)

    write_index(files)
    update_zip()
    print(f"generated_dxf_dir={DXF_DIR}")
    print(f"files={len(files)}")


if __name__ == "__main__":
    main()
