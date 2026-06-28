function convertToSeconds(){
    const input = document.getElementById("timeInput").value.trim();
    const parts = input.split(":").map(Number);
    if(parts.some(isNaN) || (parts.length !== 2 && parts.length !== 3)){
        document.getElementById("converted").innerText = "形式が正しくありません";
        return;
    }
        let total = 0;
        if(parts.length === 2){
            //mm:ss
            total = parts[0]*60 + parts[1];
        }else if(parts.length === 3){
            //hh:mm:ss
            total = parts[0]*3600 + parts[1]*60 + parts[2];
        }
    document.getElementById("converted").innerText = total + " 秒";
}

//変換結果をコピー
function copySeconds(){
    const text = document.getElementById("converted").innerText.replace(" 秒","");
    navigator.clipboard.writeText(text).then(()=>{
        showStatues(text + " copied");
    }).catch(()=>{
        alert("failed!");
    });
}

function showStatues(message){
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.style.display = "block";

    setTimeout(()=>{
        toast.style.display = "none";
    }, 1000);
}