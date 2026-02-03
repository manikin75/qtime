const fs = require("node:fs");
const path = require("node:path");
const qs = require("node:querystring");

const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");

const storage_file = path.resolve(__dirname, "state.json");
const api_root = "https://api.payzlip.se";

const iso_string = "YYYY-MM-DDTHH:mm:ss.SSS";

const organizationId = "4bde0415-bf48-4e0d-a83b-b880d3aa3163";
const userId = "4bde0415-bf48-4e0d-a83b-b880d3aa3163";
const clientId = "5jofr8lhuof52fjs87m911k70e";

const projects = {
  b2b: "5fa5f80d-305a-4596-ba49-25243bea2ceb",
  qcpro: "5fa5f80d-305a-4596-ba49-25243bea2ceb",

  qcloud: "7c2a5acc-e6be-4d66-aa23-7cb9ab791083",
  q: "7c2a5acc-e6be-4d66-aa23-7cb9ab791083",

  m: "456c1aef-3a17-4e66-b802-a7cce571b164",
  meeting: "456c1aef-3a17-4e66-b802-a7cce571b164",
  meetings: "456c1aef-3a17-4e66-b802-a7cce571b164",
};

async function main() {
  const args = parseArguments(process.argv.slice(2));

  const showHelp =
    args.flags.help ||
    args.commands.help ||
    (Object.keys(args.commands).length === 0 &&
      Object.keys(args.flags).length === 0);

  if (showHelp) {
    console.log("payzlip [options] [strays, dates, csv]");
    printColumns([
      ["  -projects", null, "# list all projects"],
      [
        "  --report <4qcloud, csv>",
        null,
        "# report project for all dates in strays, or current date",
      ],
      ["  --range <from,to>", null, "# using this overrides strays"],
      ["  -list", null, "# list reports per given dates"],
      ["  -verify", null, "# lock reports for given dates"],
      ["  -drop", null, "# drop all reports per given dates"],
      ["  -weekends", null, "# include weekends in ranges"],
      ["  -holidays", null, "# include holidays in ranges"],
      ["  --delete <report ids, csv>", null, "# delete given reports"],
      ["  --avoid <day>", null, "# avoid days"],
      ["  -debug", null, "# don't refresh token"],
    ]);

    process.exit(1);
  }

  const state = loadState({ refreshToken: null, accessToken: null });

  if (!state.refreshToken) {
    console.error(
      `Please create ./state.json with {"clientId": "<clientId>", "refreshToken": "<token>"}`,
    );

    process.exit(1);
  }

  if (!args.flags.debug) {
    let hydrated = false;

    if (!state.accessToken) {
      state.accessToken = await fetchAccessToken(clientId, state.refreshToken);
      hydrated = true;
    } else {
      const decoded = jwt.decode(state.accessToken);

      if (Date.now() / 1000 + 10 > decoded.exp) {
        state.accessToken = await fetchAccessToken(
          clientId,
          state.refreshToken,
        );
      }
    }

    if (await updateHolidays(state)) hydrated = true;

    if (hydrated) saveState(state);
  }

  const dates = args.commands.range
    ? parseRange(
        {
          includeWeekends: !!args.flags.weekends,
          holidays: args.flags.holidays ? null : state.holidays,
          avoid: args.commands.avoid ? args.commands.avoid.split(",") : null,
        },
        args.commands.range,
      )
    : args.strays.length > 0
      ? args.strays
      : [getDate(new Date())];

  if (args.flags.projects) {
    const projects = await getProjects(state);
    console.log("Projects");
    for (const project of projects) {
      console.log(" ", project.id, project.name);
    }

    return;
  }

  if (args.flags.list || args.commands.list) {
    const { start, end } = mergeDates(dates);

    const reports_by_date = await listReports(state, start, end);

    for (const date in reports_by_date) {
      const day = reports_by_date[date];
      const reports = day.reports;

      console.log(date, day.verified ? colors.fg.green("verified") : "");

      if (reports.length === 0) continue;

      for (const report of reports) {
        console.log(" ", report.id);
        console.log("   ", report.activity);
        console.log(
          "   ",
          getTime(report.startTime),
          "->",
          getTime(report.endTime),
        );
        console.log("");
      }

      console.log("");
    }

    return;
  }

  if (args.flags.drop || args.commands.drop) {
    const { start, end } = mergeDates(dates);

    const reports_by_date = await listReports(state, start, end);

    const reports_to_delete = [];

    const drop_lookup = args.commands.range
      ? null
      : dates.reduce((s, date) => {
          s.add(date);
          return s;
        }, new Set());

    for (const date in reports_by_date) {
      const day = reports_by_date[date];
      const reports = day.reports;

      if (reports.length === 0) continue;

      if (drop_lookup && !drop_lookup.has(date)) continue;

      if (day.verified) {
        console.error("Day is verified, can't drop");
        continue;
      }

      for (const report of reports) {
        reports_to_delete.push(report.id);
      }
    }

    if (reports_to_delete.length === 0) {
      console.log("Nothing to delete");
      return;
    }

    await deleteReports(state, reports_to_delete);
    return;
  }

  if (args.commands.delete) {
    await deleteReports(state, args.commands.delete.split(","));
    return;
  }

  if (args.commands.report) {
    const reports = [];

    const segments = args.commands.report.split(",");
    const test = /^(\d+)([a-zA-Z0-9]+)/;
    for (const segment of segments) {
      const match = segment.match(test);

      if (!match) {
        console.error("Received invalid segment, expects: \\d+\\s+");
        process.exit(1);
      }

      let [, duration, project] = match;

      duration = parseInt(duration, 10);
      const projectId = projects[project];

      if (!projectId) {
        console.error("Project", project, "got no id.");
        process.exit(1);
      }

      reports.push({ projectId, duration });
    }

    const { start, end } = mergeDates(dates);

    const reports_by_date = await listReports(state, start, end);
    const verified = new Set();

    for (const date in reports_by_date) {
      const day = reports_by_date[date];

      if (day.verified) {
        verified.add(date);
      }
    }

    const to_report = [];
    for (const date of dates) {
      if (verified.has(date)) {
        continue;
      }

      const timeline = buildDailyTimeline(new Date(date), reports);
      to_report.push(...timeline);
    }

    if (to_report.length === 0) {
      console.error("No reports to send");
      return;
    }

    await report(state, to_report);
  }

  if (args.flags.verify || args.commands.verify) {
    await verifyDays(state, dates);
  }
}

async function fetchAccessToken(clientId, refreshToken) {
  const res = await fetch(api_root + "/v1/auth/refresh", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      refreshToken,
    }),
  });

  const body = await res.text();
  if (res.status >= 300) {
    console.error(body);
    throw new Error("Request failed");
  }

  return JSON.parse(body).accessToken;
}

async function report(state, items) {
  const res = await fetch(
    api_root + `/v1/_/reporting/user/${userId}/presence/reports`,
    {
      method: "POST",
      headers: {
        authorization: "Bearer " + state.accessToken,
        "content-type": "application/json",
      },

      body: JSON.stringify({ items }),
    },
  );

  const body = await res.text();
  if (res.status >= 300) {
    console.error(body);
    throw new Error("Request failed");
  }

  return JSON.parse(body).accessToken;
}

async function updateHolidays(state) {
  state.holidays = state.holidays || {};
  let hydrated = false;

  for (let i = -1; i < 2; i++) {
    const year = dayjs().add(i, "years").get("year");

    if (state.holidays[year]) continue;

    const dates = await getHolidays(state, year);

    const year_lookup = state.holidays[year] || {};
    state.holidays[year] = year_lookup;

    for (const date of dates) year_lookup[date.date] = date;

    hydrated = true;
  }

  return hydrated;
}

async function getHolidays(state, year) {
  const res = await fetch(
    api_root + `/v1/organizations/${organizationId}/holidays/${year}`,
    {
      headers: {
        authorization: "Bearer " + state.accessToken,
      },
    },
  );

  const body = await res.text();
  if (res.status >= 300) {
    console.error(body);
    throw new Error("Request failed");
  }

  return JSON.parse(body);
}

async function getProjects(state) {
  const res = await fetch(
    api_root + `/v1/organizations/${organizationId}/client-settings`,
    {
      headers: {
        authorization: "Bearer " + state.accessToken,
      },
    },
  );

  const body = await res.text();
  if (res.status >= 300) {
    console.error(body);
    throw new Error("Request failed");
  }

  return JSON.parse(body).projects;
}

function loadState(fallback) {
  try {
    const buffer = fs.readFileSync(storage_file);
    return JSON.parse(buffer.toString("utf8"));
  } catch (err) {
    return fallback;
  }
}

function saveState(data) {
  fs.writeFileSync(storage_file, JSON.stringify(data));
}

async function listReports(state, start, end) {
  const query = {
    startDate: dayjs(start).startOf("day").format(iso_string),
    endDate: dayjs(end || start)
      .endOf("day")
      .format(iso_string),
    lang: "sv",
  };

  const endpoint = `/v1/_/reporting/user/${userId}/activities?${qs.stringify(query)}`;
  const res = await fetch(api_root + endpoint, {
    headers: {
      authorization: "Bearer " + state.accessToken,
    },
  });

  const body = await res.text();
  if (res.status >= 300) {
    console.error(body);
    throw new Error("Request failed");
  }

  return JSON.parse(body);
}

async function deleteReports(state, reportIds) {
  const res = await fetch(
    api_root + `/v1/_/reporting/user/${userId}/presence/reports`,
    {
      method: "DELETE",
      headers: {
        authorization: "Bearer " + state.accessToken,
        "content-type": "application/json",
      },

      body: JSON.stringify({ reportIds }),
    },
  );

  const body = await res.text();
  if (res.status >= 300) {
    console.error(body);
    throw new Error("Request failed");
  }

  if (res.status === 204) return;

  return JSON.parse(body);
}

// dates: ["2026-01-01"]
async function verifyDays(state, dates) {
  if (!dates || dates.length === 0) {
    throw new Error("Expected dates to verify");
  }

  const res = await fetch(
    api_root + `/v1/_/reporting/user/${userId}/verify-days`,
    {
      method: "PATCH",
      headers: {
        authorization: "Bearer " + state.accessToken,
        "content-type": "application/json",
      },

      body: JSON.stringify({ dates }),
    },
  );

  const body = await res.text();
  if (res.status >= 300) {
    console.error(body);
    throw new Error("Request failed");
  }

  try {
    const d = JSON.parse(body);
    return d;
  } catch (err) {
    console.error(body);
    throw err;
  }
}

function buildDailyTimeline(d, reports) {
  const out = [];

  const avoid = [[4, 1]];

  let at = 0;
  for (const _report of reports) {
    if (_report.duration === 0) continue;

    let report = { ..._report };

    for (const [start, duration] of avoid) {
      const end = start + duration;

      if (at + report.duration > start && at < end) {
        const stolen = start - at;

        if (stolen > 0) {
          out.push({ ...report, at, duration: stolen });
          report.duration -= stolen;
        }

        at += duration + stolen;
      }
    }

    if (report.duration > 0) {
      out.push({ ...report, at });
    }

    at += report.duration;
  }

  return out.map((v) => transformReport(d, v.at, v));
}

function transformReport(d, at, v) {
  const startOfDay = 8;
  const start = startOfDay + at;

  return {
    projectId: v.projectId,
    startTime: dayjs(d).set("hour", start).startOf("hour").format(iso_string),
    endTime: dayjs(d)
      .set("hour", start + v.duration)
      .startOf("hour")
      .format(iso_string),
    comment: "",
    timeCode: "normal",
  };
}

function parseArguments(args) {
  const commandTest = /^(--?)(.+)$/;

  const out = {
    flags: {},
    commands: {},
    strays: [],
  };

  let checkingForInput = false;
  let key = "";

  for (const arg of args) {
    const match = commandTest.exec(arg);

    if (match) {
      const [, hyphens, cmd] = match;
      key = cmd;

      if (checkingForInput) {
        out.flags[key] = true;
      }

      if (hyphens.length === 2) {
        checkingForInput = true;
      } else {
        out.flags[key] = true;
      }
    } else if (checkingForInput) {
      out.commands[key] = arg;
      out.commands[key] = arg;
      checkingForInput = false;
    } else {
      out.strays.push(arg);
    }
  }

  if (checkingForInput) {
    out.flags[key] = true;
  }

  return out;
}

function printColumns(rows, stream = process.stdout) {
  const lengths = {};

  for (let r = 0; r < rows.length; r++) {
    const columns = rows[r];

    for (let c = 0; c < columns.length; c++) {
      const pad = lengths[c] || 0;
      lengths[c] = Math.max(columns[c]?.length || 0, pad);
    }
  }

  for (const columns of rows) {
    for (let c = 0; c < columns.length; c++) {
      const pad = lengths[c];
      const column = columns[c] || "";
      const delta = pad - column.length;

      stream.write(column);
      stream.write(" ".repeat(delta + 1));
    }

    stream.write("\n");
  }
}

function getDate(d) {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(pad).join("-");
}

function getTime(str) {
  const d = new Date(str);
  return [d.getHours(), d.getMinutes()].map(pad).join(":");
}

const day_lookup = {
  monday: 1,
  mon: 1,

  tuesday: 2,
  tue: 2,

  wednesday: 3,
  wed: 3,

  thursday: 4,
  thur: 4,

  friday: 5,
  fri: 5,

  saturday: 6,
  sat: 6,

  sunday: 0,
  sun: 0,
};

function parseRange(opts, range) {
  const [start, end] = range.split(",").map((v) => dayjs(v));

  const out = [];

  const day_set = new Set([0, 1, 2, 3, 4, 5, 6]);

  opts.avoid?.forEach((a) => {
    day_set.delete(day_lookup[a]);
  });

  let current = start;
  while (current.valueOf() <= end.valueOf()) {
    const day = current.day();
    const year = current.get("year");

    const date = getDate(current.toDate());

    current = current.add(1, "day");

    if (!day_set.has(day)) continue;

    if (!opts.includeWeekends && (day === 0 || day === 6)) {
      continue;
    }

    if (opts.holidays?.[year]?.[date]) continue;

    if (opts.holidays?.[year]?.[date]) continue;

    out.push(date);
  }

  return out;
}

function mergeDates(dates) {
  if (dates.length === 0) throw new Error("Must have data");

  let first = Infinity;
  let last = 0;

  for (const date of dates) {
    const d = new Date(date);
    if (isNaN(d)) throw new Error("Unexpected date");

    const v = d.valueOf();

    first = Math.min(first, v);
    last = Math.max(last, v);
  }

  return { start: getDate(new Date(first)), end: getDate(new Date(last)) };
}

const getColor = (cmd) => (payload) => `\x1b[${cmd}m${payload}\x1b[m`;

function generateColorSet(offset) {
  return {
    black: getColor(offset + 0),
    red: getColor(offset + 1),
    green: getColor(offset + 2),
    yellow: getColor(offset + 3),
    blue: getColor(offset + 4),
    magenta: getColor(offset + 5),
    cyan: getColor(offset + 6),
    white: getColor(offset + 7),
  };
}

const colors = {
  bg: generateColorSet(40),
  fg: generateColorSet(30),
};

const pad = (v) => (v < 10 ? "0" + v : v);

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
