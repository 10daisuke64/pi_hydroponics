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
function convertTimestampToTime(timestamp) {
  const _d = timestamp ? new Date(timestamp * 1000) : new Date();
  const Y = _d.getFullYear();
  const m = (_d.getMonth() + 1).toString().padStart(2, '0');
  const d = _d.getDate().toString().padStart(2, '0');
  const H = _d.getHours().toString().padStart(2, '0');
  const i = _d.getMinutes().toString().padStart(2, '0');
  const s = _d.getSeconds().toString().padStart(2, '0');
  return `${H}:${i}`;
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
    let history_li = `<li>${convertTimestampToDatetime(dataArray[i].data.Time.seconds)}</li>`;
    $("#js-history").append(history_li);
  }

  /* ---------------------------
    水やり履歴
  ----------------------------- */
  let water_history_array = [];
  dataArray.forEach( function(data) {
    if( data.data.Wtr == 1 ) {
      // 水やりを実行した日時を取得
      let time = convertTimestampToDatetime(data.data.Time.seconds);
      water_history_array.push(time);
    }
  })

  if( water_history_array.length >= 3 ) {
    // 最新3件を表示
    for (var i = 0; i < 3; i++) {
      let water_history_li = `<li>${water_history_array[i]}</li>`;
      $("#js-waterhistory").append(water_history_li);
    }
  } else {
    // 3件未満の場合
    water_history_array.forEach(function(data){
      let water_history_li = `<li>${data}</li>`;
      $("#js-waterhistory").append(water_history_li);
    });
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
    data-dimension="120"
    data-text="${latest_temp}<span>&#8451;</span>"
    data-info="${temp_judgement}"
    data-width="16" data-fontsize="22"
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
  if ( latest_hum >= 70 ) {
    hum_judgement = "湿潤注意";
    hum_judgement_color = "#4293f7";
  } else if ( latest_hum < 70 && latest_hum >= 40 ) {
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
    data-dimension="120"
    data-text="${latest_hum}<span>%</span>"
    data-info="${hum_judgement}"
    data-width="16" data-fontsize="22"
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
    水位の処理 Dist
  ----------------------------- */
  const max_level = 60;
  let latest_dist = dataArray[0].data.Dist + 25;
  // 水位をパーセンテージへ変換
  let latest_dist_percent = latest_dist/max_level*100;
  let dist_judgement = "";
  let dist_judgement_color = "";

  // コンディション判定
  if ( latest_dist < 10 ) {
    dist_judgement = "水が少ないです";
    dist_judgement_color = "#fd3b3b";
  } else if ( latest_dist >= 10 && latest_dist < 30 ) {
    dist_judgement = "少し低い";
    dist_judgement_color = "#0045ff";
  } else if ( latest_dist >= 30 && latest_dist < 60 ) {
    dist_judgement = "良好";
    dist_judgement_color = "#2fcb1d";
  } else {
    dist_judgement = "水があふれそうです";
    dist_judgement_color = "#fd3b3b";
  }

  // 円グラフの表示の準備
  let dist_box_replace = `
    <div id="js-dist-chart"
    data-dimension="120"
    data-text="${latest_dist}<span>&#13212;</span>"
    data-info="${dist_judgement}"
    data-width="16" data-fontsize="22"
    data-percent="${latest_dist_percent}"
    data-fgcolor="${dist_judgement_color}"
    data-bgcolor="#f2f2f2"
    class="circliful">
    </div>
  `;
  $("#js-dist").html(dist_box_replace);

  // 円グラフ表示の実行・文字色変更
  $("#js-dist-chart").circliful();
  $("#js-dist-chart").find(".circle-info").css("color",dist_judgement_color);

  /* ---------------------------
    照度の処理 Lit
  ----------------------------- */
  const max_light = 40000;
  let latest_lit = Math.floor(dataArray[0].data.Lit);
  // 水位をパーセンテージへ変換
  let latest_lit_percent = latest_lit/max_light*100;
  console.log(latest_lit_percent);
  let lit_judgement = "";
  let lit_judgement_color = "";

  // コンディション判定
  if ( latest_lit < 1500 ) {
    lit_judgement = "光補償点以下です";
    lit_judgement_color = "#fd3b3b";
    latest_lit_percent = 1;
  } else if ( latest_lit >= 1500 && latest_lit < 5000 ) {
    lit_judgement = "暗い";
    lit_judgement_color = "#0045ff";
  } else if ( latest_lit >= 5000 && latest_lit < 10000 ) {
    lit_judgement = "少し暗い";
    lit_judgement_color = "#4293f7";
  } else if ( latest_lit >= 10000 && latest_lit < 40000 ) {
    lit_judgement = "良好";
    lit_judgement_color = "#2fcb1d";
  } else {
    lit_judgement = "光飽和点以上です";
    lit_judgement_color = "#fd3b3b";
  }

  // 円グラフの表示の準備
  let lit_box_replace = `
    <div id="js-lit-chart"
    data-dimension="120"
    data-text="${latest_lit}<span>lx</span>"
    data-info="${lit_judgement}"
    data-width="16" data-fontsize="20"
    data-percent="${latest_lit_percent}"
    data-fgcolor="${lit_judgement_color}"
    data-bgcolor="#f2f2f2"
    class="circliful">
    </div>
  `;
  $("#js-lit").html(lit_box_replace);

  // 円グラフ表示の実行・文字色変更
  $("#js-lit-chart").circliful();
  $("#js-lit-chart").find(".circle-info").css("color",lit_judgement_color);

  /* ---------------------------
    棒グラフ
  ----------------------------- */
  // データの成形
  const tempArray = [];
  const humArray = [];
  const latest_seconds = dataArray[0].data.Time.seconds;

  dataArray.forEach(function (data) {
    if ( latest_seconds - data.data.Time.seconds < 24 * 60 * 60 ) {
      let temp_inner_array = {
        x: convertTimestampToTime(data.data.Time.seconds),
        y: data.data.Temp
      };
      let hum_inner_array = {
        x: convertTimestampToTime(data.data.Time.seconds),
        y: data.data.Hum
      };
      tempArray.push(temp_inner_array);
      humArray.push(hum_inner_array);
    }
  });

  // グラフのデータ
  const chart_data = {
    datasets: [
      {
        label: '気温',
        data: tempArray,
        borderColor: '#fc4d4d',
        backgroundColor: '#ff8585',
        yAxisID: 'y',
        tension: 0.3,
        fill: false,
      },
      {
        label: '湿度',
        data: humArray,
        borderColor: '#4293f7',
        backgroundColor: '#90bff9',
        yAxisID: 'y1',
        tension: 0.3,
        fill: false,
      }
    ]
  };

  // グラフのオプション
  const config = {
    type: 'line',
    data: chart_data,
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            font: {
              size: 10,
              family: "'Noto Sans JP', sans-serif",
              weight: '700'
            }
          }
        }
      },
      stacked: false,
      scales: {
        xAxis: {
          grid: {
            borderColor: '#777777',
          },
          ticks: {
            font: {
              size: 10,
              family: "'Noto Sans JP', sans-serif",
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          suggestedMin: -5,
          suggestedMax: 45,
          grid: {
            borderColor: '#777777',
          },
          ticks: {
            font: {
              size: 10,
              family: "'Noto Sans JP', sans-serif",
            },
            callback: function(value){
			        return  value + '℃'
		        }
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          suggestedMin: 0,
          suggestedMax: 100,
          grid: {
            drawOnChartArea: false,
            borderColor: '#777777',
          },
          ticks: {
            font: {
              size: 10,
              family: "'Noto Sans JP', sans-serif",
            },
            callback: function(value){
			        return  value + '%'
		        }
          },
        },
      }
    }
  };
  const myChart = new Chart(
    document.getElementById('js-chart'),
    config
  );

});
