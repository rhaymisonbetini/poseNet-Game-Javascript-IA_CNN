import { drawSkeleton, drawKeypoitns } from './draw.js'

let model

const MIN_CONFIDENCE = 0.3;
const SIZE = 500;

let timeToPose = 5;
const MAX_STRIKES = 3;
let gameInterval;

let inverseMode = false;
let lastpose
let poseToPerform;
let isInverse;
let score = 0;
let strikes = 0;

const keypointsList = ['nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar', 'leftShoulder',
    'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist'];

async function init() {
    const video = await loadVideo();
    model = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 500, height: 500 },
        multiplier: 0.75,
    })
    detect(video);
}

function initGame() {
    score = 0;
    strikes = 0;
    [poseToPerform] = nextPose();

    let translate
    switch (poseToPerform) {
        case 'nose':
            translate = 'Nariz';
            break
        case 'leftEye':
            translate = 'Olho esquerdo'
            break
        case 'rightEye':
            translate = 'Olho direito'
            break
        case 'leftEar':
            translate = 'Orelha esquerda';
            break
        case 'rightEar':
            translate = 'Orelha direita'
            break
        case 'leftShoulder':
            translate = 'Ombro esquerdo'
            break
        case 'rightShoulder':
            translate = 'Ombro direito'
            break
        case 'leftElbow':
            translate = 'Cotovelo esquerdo'
            break
        case 'rightElbow':
            translate = 'Cotovelo direito'
            break
        case 'leftWrist':
            translate = 'Pulso esquerdo'
            break
        case 'rightWrist':
            translate = 'Pulso direito'
            break
    }

    document.getElementById('pose-to-match').innerHTML = `${translate}`;

}



function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function nextPose() {
    return [keypointsList[getRandomInt(keypointsList.length)], inverseMode && getRandomInt(3) === 0];
}

function verifyPose() {
    let result = isInverse;
    lastpose.keypoints.forEach((element) => {
        if (poseToPerform === element.part && element.score >= MIN_CONFIDENCE) {
            if (!isInverse) {
                result = true;
            } else {
                result = false;
            }
        }
    });

    return result;
}

function adjustRules() {
    switch (score) {
        case 3:
            timeToPose = 3;
            break;
        case 5:
            inverseMode = true;
            break;
        default:
            break;
    }
}

function updateState(result) {
    const p = document.getElementById('result-text');
    let text = 'WRONG';
    let textColor = 'RED';
    let gameOver = false;

    switch (result) {
        case true:
            score += 1;
            document.getElementById('score').innerHTML = `${score}`;
            text = 'CORRECT';
            textColor = 'GREEN';
            adjustRules();
            break;
        case false:
            strikes += 1;
            document.getElementById('strikes').innerHTML = `${strikes}`;

            if (strikes >= MAX_STRIKES) {
                text = 'GAME OVER';
                gameOver = true;
                resetGame();
            }

            break;
        default:
            break;
    }

    p.innerHTML = text;
    p.style.color = textColor;

    return gameOver;
}

function initGameLoop() {
    let timeleft = timeToPose;
    initGame();

    gameInterval = setInterval(() => {
        if (timeleft < 1) {
            timeleft = timeToPose;
            const result = verifyPose();
            const isGameOver = updateState(result);
            if (isGameOver) {
                return;
            }

            [poseToPerform, isInverse] = nextPose();
            console.log(poseToPerform)
            let translate
            switch (poseToPerform) {
                case 'nose':
                    translate = 'Nariz';
                    break
                case 'leftEye':
                    translate = 'Olho esquerdo'
                    break
                case 'rightEye':
                    translate = 'Olho direito'
                    break
                case 'leftEar':
                    translate = 'Orelha esquerda';
                    break
                case 'rightEar':
                    translate = 'Orelha direita'
                    break
                case 'leftShoulder':
                    translate = 'Ombro esquerdo'
                    break
                case 'rightShoulder':
                    translate = 'Ombro direito'
                    break
                case 'leftElbow':
                    translate = 'Cotovelo esquerdo'
                    break
                case 'rightElbow':
                    translate = 'Cotovelo direito'
                    break
                case 'leftWrist':
                    translate = 'Pulso esquerdo'
                    break
                case 'rightWrist':
                    translate = 'Pulso direito'
                    break
            }
         
        
            document.getElementById('pose-to-match').innerHTML = `${isInverse ? '~' : ''}${translate}`;
        }

        document.getElementById('countdown').innerHTML = `${timeleft}`;
        timeleft -= 1;
    }, 1000);
}

function createButton(innerText, selector, id, listener, disabled = false) {
    const btn = document.createElement('BUTTON');
    btn.innerText = innerText;
    btn.id = id;
    btn.disabled = disabled;

    btn.addEventListener('click', listener);
    document.querySelector(selector).appendChild(btn);
}

function prepareButtons() {
    createButton('Start', '#buttons-menu', 'start-btn',
        () => initGameLoop());

    createButton('Stop', '#buttons-menu', 'stop-btn',
        () => resetGame());
}

function resetGame() {
    ['pose-to-match', 'countdown', 'result-text', 'score', 'strikes'].forEach((id) => {
        document.getElementById(id).innerHTML = '';
    });
    clearInterval(gameInterval);
}

async function loadVideo() {
    const video = await setupCamera();
    video.play();
    return video;
}

function setupCamera() {
    const video = document.getElementById('video');
    video.width = SIZE;
    video.height = SIZE;

    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: SIZE,
            height: SIZE,
        }
    }).then((stream) => {
        video.srcObject = stream
    })

    return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(video)
    })
}


function detect(video) {
    const canvas = document.getElementById('output')
    const ctx = canvas.getContext('2d')
    canvas.width = SIZE;
    canvas.height = SIZE;

    async function getPose() {

        const pose = await model.estimateSinglePose(video, {
            flipHorizontal: true
        })

        lastpose = pose;

        ctx.clearRect(0, 0, SIZE, SIZE)

        ctx.save();
        ctx.scale(-1, 1)
        ctx.translate(- SIZE, 0)
        ctx.drawImage(video, 0, 0, SIZE, SIZE)
        ctx.restore()
        drawKeypoitns(pose.keypoints, MIN_CONFIDENCE, ctx)
        drawSkeleton(pose.keypoints, MIN_CONFIDENCE, ctx)
        requestAnimationFrame(getPose)
    }
    prepareButtons()
    getPose();
}



init();