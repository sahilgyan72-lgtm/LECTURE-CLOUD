// Timetable from GEC Palanpur, H&S Dept — Term 01/07/2026 to 11/12/2026 (WEF 01/08/2026)
export const SLOTS = [
  { start: "10:30", end: "11:30" },
  { start: "11:30", end: "12:30" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:10", end: "16:10" },
  { start: "16:10", end: "17:10" },
] as const;

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export type Division = "Civil" | "Mechanical" | "Electrical" | "Computer";

export const DIVISION_BATCHES: Record<Division, string[]> = {
  Civil: ["C1", "C2", "C3"],
  Mechanical: ["M1", "M2", "M3"],
  Electrical: ["E1", "E2"],
  Computer: ["CP1", "CP2", "CP3"],
};

export const DIVISION_ROOM: Record<Division, string> = {
  Civil: "7104",
  Mechanical: "5109",
  Electrical: "4109",
  Computer: "8109",
};

export function divisionOfBatch(batch: string): Division | null {
  for (const [d, list] of Object.entries(DIVISION_BATCHES)) if (list.includes(batch)) return d as Division;
  return null;
}

// Entry: "SUBJECT|FACULTY|ROOM|BATCHES" (batches optional = whole division)
type Cell = string[];
type Grid = Cell[][]; // [day][slot]

const civil: Grid = [
  [["Maths-1|DAP|7104"], ["Physics|KMK|7104"], ["BEE|HNC|4010|C1", "Workshop|KSB|WS6000|C2", "Physics|KMK|8103|C3"], [], ["IPDC|CGP|7012"], ["IPDC|CGP|7012"]],
  [["Physics|KMK|7104"], ["Maths-1|DAP|7104"], ["BEE|HNC|7104"], ["BCE|VJC|7104"], ["Maths-1 Tutorial|DAP|7111|C1", "Maths-1 Tutorial|VF|7111|C2", "Maths-1 Tutorial|VF1|7111|C3"], []],
  [["Library||Library"], ["BEE|HNC|7104"], ["Physics|KMK|8103|C1", "BEE|JHP|4010|C2"], ["Workshop|DMP|WS6000|C3"], [], []],
  [["BCE|VJC|7104"], ["BCE|VJC|7104"], ["BCE|VJC|7111|C1", "BCE|VHK|7111|C2"], ["BCE|VF1|7111|C3"], [], []],
  [["BEE|HNC|7104"], ["Physics|KMK|7104"], ["Workshop|KSB|WS6000|C1", "Physics|KMK|8103|C2", "BEE|JHP|4010|C3"], [], [], []],
];

const mech: Grid = [
  [["BEE|RBC|5109"], ["BME|BDP|5109"], ["IPDC|ADP|5012"], ["IPDC|ADP|5012"], ["BEE|RBC|4010|M1", "Workshop|KSB|WS6000|M2", "Physics|KMK|8103|M3"], []],
  [["Physics|KMK|5109"], ["Maths-1|DAP|7104"], ["BEE|HNC|7104"], ["BCE|VJC|7104"], ["Maths-1 Tutorial|DAP|7111|M1", "Maths-1 Tutorial|VF|7111|M2", "Maths-1 Tutorial|VF1|7111|M3"], []],
  [["BEE|RBC|5109"], ["Physics|KMK|5109"], ["BME|SKD|5112|M1", "BME|PKG|5112|M2"], ["BEE|RBC|4010|M3"], ["Library||2001"], []],
  [["Physics|KMK|5109"], ["Maths-1|DAP|5012"], ["Workshop|DMP|WS6000|M1", "Physics|KMK|8103|M2"], ["Workshop|PKG|WS6000|M3"], ["Library||2001"], []],
  [["Maths-1 Tutorial|DAP|5111|M1", "Maths-1 Tutorial|VF|5111|M2", "Maths-1 Tutorial|VF1|5111|M3"], [], ["BEE|RBC|5109"], ["BME|BDP|5109"], ["Library||2001"], []],
];

const elec: Grid = [
  [["PPS|MKP|4114|E1", "PPS|HVH|4114|E2"], [], ["BEE|RBC|4109"], ["BME|ARC|4109"], ["DFWS|MKP|4009|E1", "DFWS|BRP|4009|E2"], []],
  [["BEE|RBC|4109"], ["BME|ARC|4109"], ["PPS|HVH|4109"], ["Maths-1|DAP|5012"], ["SL / Library||Library"], ["SL / Library||Library"]],
  [["BME|BDP|5112|E1", "PPS|HVH|4114|E2"], [], ["PPS|HVH|4109"], ["BME|ADP|4109"], ["PPS|HVH|4114|E1", "BEE|RBC|4010|E2"], []],
  [["BEE|RBC|4109"], ["Maths-1|DAP|5012"], ["BEE|RBC|4010|E1", "BME|AKP|5112|E2"], [], ["SL / Library||Library"], ["SL / Library||Library"]],
  [["Maths-1 Tutorial|DAP|5111"], [], ["IPDC|CGP|4012"], [], ["SL / Library||Library"], ["SL / Library||Library"]],
];

const comp: Grid = [
  [["BME|AKP|8109"], ["PPS|KMG|8109"], ["Maths-1|DAP|8109"], ["BEE|JHP|8109"], ["Maths-1 Tutorial|DAP|8112|CP1", "Maths-1 Tutorial|VF|8112|CP2", "Maths-1 Tutorial|VF1|8112|CP3"], []],
  [["BEE|JHP|8109"], ["BME|PNB|8109"], ["PPS|KMG|4111|CP1", "PPS|VF|4111|CP2", "BME|BDP|5112|CP3"], [], ["BEE|JHP|4010|CP1", "DFWS|MGP|4009|CP2", "SL / Library||Library|CP3"], []],
  [["Maths-1|DAP|8109"], ["BME|PNB|8109"], ["IPDC|CGP|8109"], ["IPDC|CGP|8109"], ["BME|BDP|5112|CP1", "SL / Library||Library|CP2", "DFWS|BRP|4009|CP3"], []],
  [["PPS|KMG|8109"], ["BEE|JHP|8109"], ["DFWS|MGP|4009|CP1", "BME|ADP|5112|CP2", "BEE|JHP|4010|CP3"], [], ["SL / Library||Library|CP1", "PPS|KMG|4111|CP2", "PPS|VF|4111|CP3"], []],
  [["PPS|VF|4111|CP1", "BEE|JHP|4010|CP2", "PPS|KMG|4111|CP3"], [], ["SL / Library||Library"], [], ["SL / Library||Library"], []],
];

const GRIDS: Record<Division, Grid> = { Civil: civil, Mechanical: mech, Electrical: elec, Computer: comp };

export type Lecture = {
  day: number; // 1 = Monday
  slot: number;
  start: string;
  end: string;
  subject: string;
  faculty: string;
  room: string;
};

export function lecturesForBatch(batch: string): Lecture[] {
  const div = divisionOfBatch(batch);
  if (!div) return [];
  const out: Lecture[] = [];
  GRIDS[div].forEach((day, d) =>
    day.forEach((cell, s) => {
      for (const raw of cell) {
        const [subject, faculty, room, batches] = raw.split("|");
        if (batches && !batches.split(",").includes(batch)) continue;
        out.push({ day: d + 1, slot: s, ...SLOTS[s], subject: subject ?? "", faculty: faculty ?? "", room: room || DIVISION_ROOM[div] });
      }
    }),
  );
  return out;
}

export function subjectsForBatch(batch: string) {
  return [...new Set(lecturesForBatch(batch).map((l) => l.subject))].filter((s) => !/library/i.test(s));
}
