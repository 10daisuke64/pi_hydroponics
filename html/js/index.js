/* ---------------------------
  日付の成形
----------------------------- */
function convertTimestampToDatetime(timestamp) {
  const _d = timestamp ? new Date(timestamp * 1000) : new Date();
  const Y = _d.getFullYear();
  const m = (_d.getMonth() + 1).toString().padStart(2, '0');
  const d = _d.getDate().toString().padStart(2, '0');
  const H = _d.getHours().toString().padStart(2, '0');
  const i = _d.getMinutes().toString().padStart(2, '0');
  const s = _d.getSeconds().toString().padStart(2, '0');
  return `${m}/${d} ${H}:${i}`;
}

/* ---------------------------
  firebase settings
----------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.5.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.5.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "",
  authDomain: "pitemp-7dfee.firebaseapp.com",
  projectId: "pitemp-7dfee",
  storageBucket: "pitemp-7dfee.appspot.com",
  messagingSenderId: "262773852673",
  appId: "1:262773852673:web:1af4175a2567f203e94e00"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const q = query(collection(db, "Database"), orderBy("Time", "desc"));

/* ---------------------------
  データ取得
----------------------------- */
onSnapshot(q, (querySnapshot) => {

  // デーtの取り出し
  const dataArray = [];
  querySnapshot.docs.forEach(function (doc) {
    const data = {
      id: doc.id,
      data: doc.data()
    };
    dataArray.push(data);
  });
  console.log(dataArray);

  /* ---------------------------
    更新履歴
  ----------------------------- */
  // 最新3件を表示
  for (var i = 0; i < 3; i++) {
    let history_li = `<li>${convertTimestampToDatetime(dataArray[i].data.Time.second)}</li>`;
    $("#js-history").append(history_li);
  }

  /* ---------------------------
    水やり履歴
  ----------------------------- */
  let water_history_array = [];
  dataArray.forEach( function(data) {
    if( data.data.Wtr == 1 ) {
      // 水やりを実行した日時を取得
      let time = convertTimestampToDatetime(data.data.Time.second);
      water_history_array.push(time);
    }
  })
  // 最新3件を表示
  for (var i = 0; i < 3; i++) {
    let water_history_li = `<li>${water_history_array[i]}</li>`;
    $("#js-waterhistory").append(water_history_li);
  }

  /* ---------------------------
    温度の処理 Temp
  ----------------------------- */
  let latest_temp = dataArray[0].data.Temp;
  // 温度をパーセンテージへ変換 0℃ = 0% , 40℃ = 100% とした場合
  let latest_temp_percent = latest_temp/40*100;
  let temp_judgement = "";
  let temp_judgement_color = "";

  // コンディション判定
  if ( latest_temp < 1 ) {
    temp_judgement = "凍結注意";
    temp_judgement_color = "#fd3b3b";
    latest_temp_percent = 1;
  } else if ( latest_temp >= 1 && latest_temp < 11 ) {
    temp_judgement = "低温注意";
    temp_judgement_color = "#0045ff";
  } else if ( latest_temp >= 11 && latest_temp < 16 ) {
    temp_judgement = "少し寒い";
    temp_judgement_color = "#4293f7";
  } else if ( latest_temp >= 15 && latest_temp < 26 ) {
    temp_judgement = "良好";
    temp_judgement_color = "#2fcb1d";
  } else if ( latest_temp >= 26 && latest_temp < 31 ) {
    temp_judgement = "少し暑い";
    temp_judgement_color = "#ffd61a";
  } else {
    temp_judgement = "高温注意";
    temp_judgement_color = "#fd3b3b";
  }

  // 円グラフの表示の準備
  let temp_box_replace = `
    <div id="js-temp-chart"
    data-dimension="150"
    data-text="${latest_temp}<span>&#8451;</span>"
    data-info="${temp_judgement}"
    data-width="20" data-fontsize="28"
    data-percent="${latest_temp_percent}"
    data-fgcolor="${temp_judgement_color}"
    data-bgcolor="#f2f2f2"
    class="circliful">
    </div>
  `;
  $("#js-temp").html(temp_box_replace);

  // 円グラフ表示の実行・文字色変更
  $("#js-temp-chart").circliful();
  $("#js-temp-chart").find(".circle-info").css("color",temp_judgement_color);

  /* ---------------------------
    湿度の処理 Hum
  ----------------------------- */
  let latest_hum = dataArray[0].data.Hum;
  let hum_judgement = "";
  let hum_judgement_color = "";

  // コンディション判定
  if ( latest_hum >= 60 ) {
    hum_judgement = "湿潤注意";
    hum_judgement_color = "#4293f7";
  } else if ( latest_hum < 60 && latest_hum >= 40 ) {
    hum_judgement = "良好";
    hum_judgement_color = "#2fcb1d";
  } else if ( latest_hum < 40 && latest_hum > 20 ) {
    hum_judgement = "少し乾燥";
    hum_judgement_color = "#ffd61a";
  } else {
    hum_judgement = "乾燥注意";
    hum_judgement_color = "#fd3b3b";
  }

  // 円グラフの表示の準備
  let hum_box_replace = `
    <div id="js-hum-chart"
    data-dimension="150"
    data-text="${latest_hum}<span>%</span>"
    data-info="${hum_judgement}"
    data-width="20" data-fontsize="28"
    data-percent="${latest_hum}"
    data-fgcolor="${hum_judgement_color}"
    data-bgcolor="#f2f2f2"
    class="circliful">
    </div>
  `;
  $("#js-hum").html(hum_box_replace);

  // 円グラフ表示の実行・文字色変更
  $("#js-hum-chart").circliful();
  $("#js-hum-chart").find(".circle-info").css("color",hum_judgement_color);


  /* ---------------------------
    棒グラフ
  ----------------------------- */
  // データの成形
  const tempArray = [];
  const humArray = [];

  dataArray.forEach(function (data) {
    let temp_inner_array = {
      x: convertTimestampToDatetime(data.data.Time.seconds),
      y: data.data.Temp
    }
    let hum_inner_array = {
      x: convertTimestampToDatetime(data.data.Time.seconds),
      y: data.data.Hum
    }
    tempArray.push(temp_inner_array);
    humArray.push(hum_inner_array);
  });

  console.log(tempArray)

  const $ctx = $("#js-chart");
  var myChart = new Chart($ctx, {

    type: 'line',
    data: {
      datasets: [
        {
          label: '気温',
          data: tempArray,
          borderColor: 'red',
          backgroundColor: 'transparent'
        },{
          label: '湿度',
          data: humArray,
          borderColor: 'blue',
          backgroundColor: 'transparent'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
          }
        },
        y: [
          {
            beginAtZero: true,
            suggestedMax: 40,
          }, {
            beginAtZero: true,
            suggestedMax: 100,
          }
        ]
      }
    }
  });
});
