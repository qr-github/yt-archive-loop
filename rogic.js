let player = null;
let apiReady = false;
let allSections = []; // {videoId, start, end} のフラットな配列にする
let currentIndex = 0;
let intervalId = null;

function onYouTubeIframeAPIReady() { apiReady = true; }

// 入力枠の追加
function addUnit(url = "", sections = "") {
    const id = "unit" + Date.now() + Math.random().toString(36).substring(2,9);
    const html = `
        <div class="video-unit" id="${id}">
            <span class="remove-btn" onclick="removeUnit('${id}')">✕ 削除</span>
            <div>動画URL: <input type="text" class="v-url" style="width:400px" value="${url}"></div>
            <div style="margin-top:5px;">
                ループ区間:<br>
                <textarea class="v-sections" rows="3" cols="60">${sections}</textarea>
            </div>
        </div>`;
    document.getElementById("videoUnits").insertAdjacentHTML('beforeend', html);
}

function removeUnit(id) {
    if(document.querySelectorAll('.video-unit').length > 1) {
        document.getElementById(id).remove();
    }
}

function extractVideoId(url){
    const patterns = [/v=([^&]+)/, /youtu\.be\/([^?&]+)/, /\/live\/([^?&]+)/, /\/embed\/([^?&]+)/];
    for(const p of patterns){
        const m = url.match(p);
        if(m && m[1]) return m[1];
    }
    return null;
}

function start(){
    allSections = [];
    const units = document.querySelectorAll('.video-unit');

    units.forEach(unit => {
        const url = unit.querySelector('.v-url').value.trim();
        const vId = extractVideoId(url);
        if(!vId) return;

        const lines = unit.querySelector('.v-sections').value.trim().split("\n");
        lines.forEach(line => {
            const [s, e] = line.split(",").map(Number);
            if(!isNaN(s) && !isNaN(e) && e > s) {
                allSections.push({ videoId: vId, start: s, end: e });
            }
        });
    });

    if(!allSections.length) {
        alert("有効な動画URLと区間を入力してください");
        return;
    }

    currentIndex = 0;
    const first = allSections[currentIndex];

    if(player) {
        player.loadVideoById({ videoId: first.videoId, startSeconds: first.start });
    } else {
        if(!apiReady) return alert("API準備中...");
        player = new YT.Player("player", {
            videoId: first.videoId,
            playerVars: { autoplay: 1, controls: 1 },
            events: { onReady: () => {
                player.seekTo(first.start, true);
                if(intervalId) clearInterval(intervalId);
                intervalId = setInterval(checkLoop, 200);
            }}
        });
    }
}

function checkLoop(){
    if(!player || !allSections.length) return;
    if(player.getPlayerState() !== YT.PlayerState.PLAYING) return;

    const s = allSections[currentIndex];
    const t = player.getCurrentTime();

    if(t >= s.end){
        const oldId = s.videoId;
        if(document.getElementById("playAll").checked) {
            currentIndex = (currentIndex + 1) % allSections.length;
        }
        const next = allSections[currentIndex];

        if(next.videoId === oldId) {
            player.seekTo(next.start, true);
        } else {
            player.loadVideoById({ videoId: next.videoId, startSeconds: next.start });
        }
    }
}

 // 設定をJSONとしてダウンロード
function saveConfig() {
    const data = [];
    document.querySelectorAll('.video-unit').forEach(unit => {
        const url = unit.querySelector('.v-url').value.trim();
        const sections = unit.querySelector('.v-sections').value.trim();

        if(!url || !sections){
            showStatus("空のフォームがあります");
            return;
        }
        data.push({
            url: url,
            sections: sections
        });

        if(data.length > 0){
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `yt_loop_config.json`;
            a.click();
        }else{
            showStatus("保存できる入力がありません");
        }
    });
}

// ファイルを読み込んで入力欄を再生成
function loadConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) return;
            document.getElementById("videoUnits").innerHTML = ""; // 既存の入力を全削除
            data.forEach(item => addUnit(item.url, item.sections)); // 保存データ分だけ作成
        } catch (err) {
            alert("ファイルの読み込みに失敗しました");
        }
    };
    reader.readAsText(file);
}