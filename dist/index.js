"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const date_fns_1 = require("date-fns");
const lodash_1 = require("lodash");
const fp_1 = require("lodash/fp");
const vhtml_1 = __importDefault(require("vhtml"));
var Extensions;
(function (Extensions) {
    Extensions["any"] = ".+";
    Extensions["go"] = "go";
    Extensions["haskell"] = "hs";
    Extensions["javascript"] = "js";
    Extensions["typescript"] = "ts";
})(Extensions || (Extensions = {}));
exports.default = async (req, res) => {
    const completedDays = await getCompletedDays();
    res.setHeader('Content-Type', 'image/svg+xml');
    return createImage(completedDays);
};
async function getCompletedDays() {
    const owner = 'caseyWebb';
    const repo = 'dcp';
    const ref = 'master';
    const language = 'any';
    const ext = Extensions[language];
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
    const res = await axios_1.default.get(url);
    const regex = new RegExp(`(?<year>\\d{4})/(?<month>\\d+)/(?<day>\\d+)\\.${ext}`, 'u');
    const zeroPad = fp_1.padCharsStart('0');
    const zeroPad2 = zeroPad(2);
    return new Set(fp_1.flow(fp_1.filter(({ type }) => type === 'blob'), fp_1.map(({ path }) => regex.exec(path)), fp_1.filter((f) => f !== null), fp_1.map((f) => f.groups), fp_1.map((f) => `${f.year}.${zeroPad2(f.month)}.${zeroPad2(f.day)}`), fp_1.uniq)(res.data.tree));
}
function createImage(completedDays) {
    const css = `
    * {
      font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;
    }
    .month, .wday {
      fill: #767676;
    }
    .month {
      font-size: 10px;
    }
    .wday {
      font-size: 9px;
    }
  `;
    return (vhtml_1.default("svg", { width: "669", height: "104", xmlns: "http://www.w3.org/2000/svg" },
        vhtml_1.default("style", null, css),
        vhtml_1.default("g", null,
            vhtml_1.default("g", { transform: "translate(17, 20)" }, lodash_1.times(53, (i) => createGridColumn(completedDays, i + 1))),
            vhtml_1.default("g", { transform: "translate(29, 10)" }, lodash_1.times(12, (i) => createMonthLabel(i + 1))),
            vhtml_1.default("text", { class: "wday", dx: "2", dy: "40" }, "Mon"),
            vhtml_1.default("text", { class: "wday", dx: "2", dy: "64" }, "Wed"),
            vhtml_1.default("text", { class: "wday", dx: "2", dy: "89" }, "Fri"))));
}
function createMonthLabel(m) {
    const label = getMonthLabel(m);
    const x = getMonthX(m);
    return (vhtml_1.default("text", { class: "month", x: x }, label));
}
function createGridColumn(completedDays, w) {
    return vhtml_1.default("g", null, lodash_1.times(7, (d) => createGridBlock(completedDays, w, d)));
}
function createGridBlock(completedDays, w, d) {
    const date = getDate(w, d);
    const x = 12 * w;
    const y = 12 * d;
    const fill = getFill(completedDays, date);
    const title = date_fns_1.format(date, 'EEEE MMMM do, yyyy');
    return (vhtml_1.default("rect", { width: "10", height: "10", x: x, y: y, fill: fill },
        vhtml_1.default("title", null, title)));
}
function getDate(w, dw) {
    const weeksAgo = 53 - w;
    let date = new Date();
    date = date_fns_1.subWeeks(date, weeksAgo);
    date = date_fns_1.setDay(date, dw);
    return date;
}
function getFill(completedDays, date) {
    const now = new Date();
    const completed = completedDays.has(date_fns_1.format(date, 'yyyy.MM.dd'));
    const transparent = 'rgba(0,0,0,0)';
    const green = '#7bc96f';
    const gray = '#ebedf0';
    switch (true) {
        case date > now: return transparent;
        case completed: return green;
        default: return gray;
    }
}
function getMonthLabel(m) {
    const monthsAgo = 12 - m;
    const now = new Date();
    const then = date_fns_1.subMonths(now, monthsAgo);
    return date_fns_1.format(then, 'MMM');
}
function getMonthX(m) {
    const monthsAgo = 12 - m;
    const now = new Date();
    const targetMonth = date_fns_1.getMonth(date_fns_1.subMonths(now, monthsAgo));
    let then = date_fns_1.setDay(date_fns_1.subMonths(now, 12), 0);
    let column = 0;
    while (date_fns_1.getMonth(then) !== targetMonth || date_fns_1.getDate(then) > 7) {
        column++;
        then = date_fns_1.addWeeks(then, 1);
    }
    return 12 * column;
}
