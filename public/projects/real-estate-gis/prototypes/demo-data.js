// One synthetic existing-building dataset for the public prototypes.
// Legacy status meanings and screenshot colours are evidence; room assignments are demonstration data.
(() => {
  const statuses = [
  {
    "key": "presale",
    "label": "已预售许可",
    "color": "#ceff94"
  },
  {
    "key": "filing",
    "label": "已备案",
    "color": "#cee7ff"
  },
  {
    "key": "prebuy",
    "label": "已预购预告",
    "color": "#5acb73"
  },
  {
    "key": "premortgage",
    "label": "已预抵预告",
    "color": "#ff864a"
  },
  {
    "key": "transferNotice",
    "label": "已转让预告",
    "color": "#848284"
  },
  {
    "key": "mortgageNotice",
    "label": "已抵押预告",
    "color": "#efaa94"
  },
  {
    "key": "objection",
    "label": "已异议",
    "color": "#ffff00"
  },
  {
    "key": "ownership",
    "label": "已确权",
    "color": "#c6cbe7"
  },
  {
    "key": "maxMortgage",
    "label": "已设立最高额抵押",
    "color": "#f74d00"
  },
  {
    "key": "confirmedMaxMortgage",
    "label": "已确定最高额抵押数额",
    "color": "#ff0084"
  },
  {
    "key": "mortgage",
    "label": "已抵押",
    "color": "#5255ad"
  },
  {
    "key": "seizure",
    "label": "已查封",
    "color": "#ce0000"
  },
  {
    "key": "preSeizure",
    "label": "已预查封",
    "color": "#de0000"
  },
  {
    "key": "restricted",
    "label": "已权利限制",
    "color": "#de006b"
  },
  {
    "key": "rented",
    "label": "已租赁",
    "color": "#ffff84"
  },
  {
    "key": "constructionMortgage",
    "label": "已在建工程抵押",
    "color": "#ffc78c"
  },
  {
    "key": "stock",
    "label": "已存量房备案",
    "color": "#ff96ff"
  },
  {
    "key": "manualFreeze",
    "label": "已手动拆分冻结",
    "color": "#ffff00"
  },
  {
    "key": "extinguished",
    "label": "已客体灭失",
    "color": "#420042"
  },
  {
    "key": "unpaidFund",
    "label": "未缴纳维修基金",
    "color": "#5a0000"
  }
];
  const roomCount = (floor, unit) => unit === 1 && floor === 15 ? 2 : unit === 1 && floor === 8 ? 6 : unit === 2 && floor === 20 ? 3 : unit === 3 && floor === 12 ? 5 : unit === 3 && floor === 3 ? 2 : 4;
  const rooms = [];
  for (let floor = 27; floor >= 1; floor--) {
    for (let unit = 1; unit <= 3; unit++) {
      for (let index = 1; index <= roomCount(floor, unit); index++) {
        const seed = floor * 17 + unit * 7 + index;
        const area = floor === 15 && unit === 1 && index === 1 ? 94.20 : floor === 8 && unit === 1 && index === 2 ? 86.80 : Math.round((86 + (floor % 4) * 2.6 + index * 0.4 + (unit - 1) * 3) * 100) / 100;
        const room = {
          id: `${floor}_${unit}_${index}`, floor, unit, index,
          number: String(floor * 100 + index),
          nominal: floor === 18 ? '17A 层' : `${floor} 层`, area,
          states: ['ownership', statuses[seed % statuses.length].key],
          nature: ['★', '★', '●', '△', '□'][seed % 5]
        };
        room.states = [...new Set(room.states)];
        rooms.push(Object.freeze(room));
      }
    }
  }
  window.GIS_DEMO = Object.freeze({ floors: 27, surveyType: '预测', rooms: Object.freeze(rooms), statuses: Object.freeze(statuses) });
})();
