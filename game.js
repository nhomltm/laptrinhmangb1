import { playhtml } from "https://unpkg.com/playhtml";

// =====================================================
// CẤU HÌNH
// =====================================================

const BOARD_SIZE = 9;

const COLUMNS = [
    "a", "b", "c",
    "d", "e", "f",
    "g", "h", "i"
];

// =====================================================
// DOM
// =====================================================

const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const nameInput = document.getElementById("nameInput");
const roomInput = document.getElementById("roomInput");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const watchRoomBtn = document.getElementById("watchRoomBtn");

const roomDisplay = document.getElementById("roomDisplay");
const roleDisplay = document.getElementById("roleDisplay");

const blueName = document.getElementById("blueName");
const redName = document.getElementById("redName");

const turnDisplay = document.getElementById("turnDisplay");
const statusDisplay = document.getElementById("statusDisplay");

const boardElement = document.getElementById("board");

const backBtn = document.getElementById("backBtn");

// =====================================================
// BIẾN GAME
// =====================================================

let playData = null;

let myPid = null;

let myName = "";

let myRole = "viewer";

let selectedPieceId = null;

let currentRoom = "";

// =====================================================
// KHỞI TẠO
// =====================================================

async function init() {
    const params = new URLSearchParams(
        window.location.search
    );

    currentRoom = normalizeRoomCode(
        params.get("room") || ""
    );

    myName =
        sessionStorage.getItem("ottv2-name") ||
        "";

    myPid =
        params.get("pid") ||
        crypto.randomUUID();

    // -----------------------------------------------
    // Nếu chưa vào phòng -> hiện menu
    // -----------------------------------------------

    if (!currentRoom) {
        showMenu();
        await initLobby();
        return;
    }

    // -----------------------------------------------
    // Đã vào phòng
    // -----------------------------------------------

    if (!myName) {
        alert("Vui lòng nhập tên trước.");
        goHome();
        return;
    }

    await initGame();
}

// =====================================================
// MENU
// =====================================================

function showMenu() {
    menuScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");
}

function showGame() {
    menuScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
}

// =====================================================
// PLAYHTML - LOBBY
// =====================================================

async function initLobby() {
    await playhtml.init({
        room: "ottv2-lobby"
    });

    await playhtml.ready;
}

// =====================================================
// PLAYHTML - GAME
// =====================================================

async function initGame() {
    showGame();

    const gameRoomName =
        "ottv2-game-" +
        normalizeRoomCode(currentRoom);

    // Mỗi mã phòng tương ứng với một PlayHTML room riêng
    await playhtml.init({
        room: gameRoomName
    });

    await playhtml.ready;

    // Game state dùng Page Data
    playData = playhtml.createPageData(
        "ottv2-game-state",
        createInitialState()
    );

    playData.onUpdate((state) => {
        // Nếu chưa có vai trò thì thử nhận
        tryAssignRole(state);

        renderGame(state);
    });

    // Thử nhận vai trò ngay lần đầu
    tryAssignRole(
        playData.getData()
    );

    renderGame(
        playData.getData()
    );

    roomDisplay.textContent =
        `Phòng: ${currentRoom}`;
}

// =====================================================
// STATE BAN ĐẦU
// =====================================================

function createInitialState() {
    return {
        version: 1,

        players: {
            blue: null,
            red: null
        },

        playerNames: {
            blue: "",
            red: ""
        },

        pieces: createInitialPieces(),

        turn: "blue",

        winner: null,

        winReason: null,

        moveNumber: 0
    };
}

// =====================================================
// QUÂN BAN ĐẦU
// =====================================================

function createInitialPieces() {
    const pieces = [];

    // -----------------------------------------------
    // XANH
    // -----------------------------------------------

    addPiece(
        pieces,
        "blue",
        "rock",
        "a9"
    );

    addPiece(
        pieces,
        "blue",
        "paper",
        "b9"
    );

    addPiece(
        pieces,
        "blue",
        "scissors",
        "c9"
    );

    addPiece(
        pieces,
        "blue",
        "rock",
        "a8"
    );

    addPiece(
        pieces,
        "blue",
        "paper",
        "b8"
    );

    addPiece(
        pieces,
        "blue",
        "scissors",
        "c8"
    );

    addPiece(
        pieces,
        "blue",
        "rock",
        "a7"
    );

    addPiece(
        pieces,
        "blue",
        "paper",
        "b7"
    );

    addPiece(
        pieces,
        "blue",
        "scissors",
        "c7"
    );

    // -----------------------------------------------
    // ĐỎ
    // -----------------------------------------------

    addPiece(
        pieces,
        "red",
        "rock",
        "i1"
    );

    addPiece(
        pieces,
        "red",
        "paper",
        "h1"
    );

    addPiece(
        pieces,
        "red",
        "scissors",
        "g1"
    );

    addPiece(
        pieces,
        "red",
        "rock",
        "i2"
    );

    addPiece(
        pieces,
        "red",
        "paper",
        "h2"
    );

    addPiece(
        pieces,
        "red",
        "scissors",
        "g2"
    );

    addPiece(
        pieces,
        "red",
        "rock",
        "i3"
    );

    addPiece(
        pieces,
        "red",
        "paper",
        "h3"
    );

    addPiece(
        pieces,
        "red",
        "scissors",
        "g3"
    );

    return pieces;
}

function addPiece(
    pieces,
    color,
    type,
    position
) {
    pieces.push({
        id: `${color}-${type}-${pieces.length}`,
        color,
        type,
        position
    });
}

// =====================================================
// TẠO TOKEN CHO MỖI LẦN VÀO
// =====================================================

function createVisitId() {
    return crypto.randomUUID();
}

// =====================================================
// NHẬN VAI TRÒ
// =====================================================

function tryAssignRole(state) {
    const requestedRole =
        getRequestedRole();

    // -----------------------------------------------
    // XEM TRẬN
    // -----------------------------------------------

    if (requestedRole === "watch") {
        myRole = "viewer";
        updateRoleDisplay();
        return;
    }

    // -----------------------------------------------
    // ĐÃ CÓ VAI TRÒ
    // -----------------------------------------------

    if (
        state.players.blue === myPid
    ) {
        myRole = "blue";
        updateRoleDisplay();
        return;
    }

    if (
        state.players.red === myPid
    ) {
        myRole = "red";
        updateRoleDisplay();
        return;
    }

    // -----------------------------------------------
    // TẠO PHÒNG
    // -----------------------------------------------

    if (requestedRole === "create") {
        // Người tạo chỉ có thể nhận Xanh
        if (!state.players.blue) {
            playData.setData((data) => {
                if (!data.players.blue) {
                    data.players.blue = myPid;
                    data.playerNames.blue = myName;
                }
            });

            return;
        }

        // Xanh đã có người khác
        myRole = "viewer";
        updateRoleDisplay();
        return;
    }

    // -----------------------------------------------
    // VÀO PHÒNG
    // -----------------------------------------------

    if (requestedRole === "join") {
        // Chỉ nhận Đỏ nếu đã có Xanh
        if (
            state.players.blue &&
            !state.players.red
        ) {
            playData.setData((data) => {
                // Kiểm tra lại trong setData
                if (
                    data.players.blue &&
                    !data.players.red
                ) {
                    data.players.red = myPid;
                    data.playerNames.red = myName;
                }
            });

            return;
        }

        // Xanh chưa xuất hiện
        if (!state.players.blue) {
            myRole = "viewer";
            updateRoleDisplay();
            return;
        }

        // Đỏ đã có người
        myRole = "viewer";
        updateRoleDisplay();
    }
}

// =====================================================
// LẤY ROLE TRÊN URL
// =====================================================

function getRequestedRole() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("role") || "watch";
}

// =====================================================
// HIỂN THỊ ROLE
// =====================================================

function updateRoleDisplay() {
    if (myRole === "blue") {
        roleDisplay.textContent =
            `🔵 ${myName} — Xanh`;
        return;
    }

    if (myRole === "red") {
        roleDisplay.textContent =
            `🔴 ${myName} — Đỏ`;
        return;
    }

    roleDisplay.textContent =
        `👁️ ${myName} — Người xem`;
}

// =====================================================
// RENDER GAME
// =====================================================

function renderGame(state) {
    renderPlayers(state);
    renderBoard(state);
    renderTurn(state);
    renderStatus(state);
    updateRoleDisplay();
}

// =====================================================
// HIỂN THỊ TÊN
// =====================================================

function renderPlayers(state) {
    blueName.textContent =
        state.playerNames.blue ||
        "Đang chờ người chơi...";

    redName.textContent =
        state.playerNames.red ||
        "Đang chờ người chơi...";
}

// =====================================================
// RENDER BÀN CỜ
// =====================================================

function renderBoard(state) {
    boardElement.innerHTML = "";

    for (
        let row = 1;
        row <= BOARD_SIZE;
        row++
    ) {
        for (
            let col = 0;
            col < BOARD_SIZE;
            col++
        ) {
            const position =
                COLUMNS[col] + row;

            const cell =
                document.createElement("div");

            cell.className = "cell";

            cell.dataset.position =
                position;

            // ---------------------------------------
            // Nhà chính
            // ---------------------------------------

            if (
                position === "a9" ||
                position === "i1"
            ) {
                cell.classList.add("homeBase");
            }

            // ---------------------------------------
            // Quân
            // ---------------------------------------

            const piece =
                state.pieces.find(
                    p =>
                        p.position ===
                        position
                );

            if (piece) {
                const pieceElement =
                    document.createElement("div");

                pieceElement.className =
                    `piece ${piece.color}`;

                pieceElement.textContent =
                    getPieceSymbol(
                        piece.type
                    );

                // Quan trọng:
                // click quân sẽ xuyên xuống cell
                pieceElement.style.pointerEvents =
                    "none";

                cell.appendChild(
                    pieceElement
                );
            }

            // ---------------------------------------
            // Selected
            // ---------------------------------------

            if (selectedPieceId) {
                const selected =
                    state.pieces.find(
                        p =>
                            p.id ===
                            selectedPieceId
                    );

                if (
                    selected &&
                    selected.position ===
                    position
                ) {
                    cell.classList.add(
                        "selected"
                    );
                }
            }

            // ---------------------------------------
            // Click
            // ---------------------------------------

            cell.addEventListener(
                "click",
                () => {
                    handleCellClick(
                        position
                    );
                }
            );

            boardElement.appendChild(
                cell
            );
        }
    }
}

// =====================================================
// BIỂU TƯỢNG QUÂN
// =====================================================

function getPieceSymbol(type) {
    if (type === "rock") {
        return "🪨";
    }

    if (type === "paper") {
        return "📄";
    }

    if (type === "scissors") {
        return "✂️";
    }

    return "?";
}

// =====================================================
// CLICK Ô
// =====================================================

function handleCellClick(position) {
    if (!playData) {
        return;
    }

    const state =
        playData.getData();

    // -----------------------------------------------
    // Không được đi nếu trận kết thúc
    // -----------------------------------------------

    if (state.winner) {
        return;
    }

    // -----------------------------------------------
    // Người xem không được đi
    // -----------------------------------------------

    if (myRole === "viewer") {
        statusDisplay.textContent =
            "Bạn đang xem trận.";
        return;
    }

    // -----------------------------------------------
    // Chưa tới lượt
    // -----------------------------------------------

    if (state.turn !== myRole) {
        statusDisplay.textContent =
            "Chưa tới lượt bạn.";
        return;
    }

    // -----------------------------------------------
    // Nếu chưa chọn quân
    // -----------------------------------------------

    if (!selectedPieceId) {
        const piece =
            state.pieces.find(
                p =>
                    p.position ===
                    position
            );

        if (!piece) {
            return;
        }

        if (
            piece.color !== myRole
        ) {
            statusDisplay.textContent =
                "Bạn chỉ được chọn quân của mình.";
            return;
        }

        selectedPieceId =
            piece.id;

        renderGame(state);
        return;
    }

    // -----------------------------------------------
    // Đang chọn quân -> chọn ô đi
    // -----------------------------------------------

    moveSelectedPiece(
        position
    );
}

// =====================================================
// DI CHUYỂN + ĂN QUÂN
// =====================================================

function moveSelectedPiece(
    targetPosition
) {
    const state =
        playData.getData();

    const piece =
        state.pieces.find(
            p =>
                p.id ===
                selectedPieceId
        );

    if (!piece) {
        selectedPieceId = null;
        renderGame(state);
        return;
    }

    // -----------------------------------------------
    // Click lại quân đang chọn
    // -----------------------------------------------

    if (
        piece.position ===
        targetPosition
    ) {
        selectedPieceId = null;
        renderGame(state);
        return;
    }

    // -----------------------------------------------
    // Phải đi đúng 1 ô
    // -----------------------------------------------

    if (
        !isOneSquareMove(
            piece.position,
            targetPosition
        )
    ) {
        statusDisplay.textContent =
            "Mỗi quân chỉ được đi đúng 1 ô.";
        return;
    }

    // -----------------------------------------------
    // Tìm quân ở ô đích
    // -----------------------------------------------

    const targetPiece =
        state.pieces.find(
            p =>
                p.position ===
                targetPosition
        );

    // -----------------------------------------------
    // Có quân cùng phe
    // -----------------------------------------------

    if (
        targetPiece &&
        targetPiece.color ===
        piece.color
    ) {
        statusDisplay.textContent =
            "Không thể đi vào ô có quân của mình.";
        return;
    }

    // -----------------------------------------------
    // Có quân đối phương -> kiểm tra RPS
    // -----------------------------------------------

    if (targetPiece) {
        if (
            !canCapture(
                piece.type,
                targetPiece.type
            )
        ) {
            statusDisplay.textContent =
                "Quân này không thể ăn quân đó.";
            return;
        }
    }

    // Lưu ID vì selectedPieceId là biến local
    const movingPieceId =
        selectedPieceId;

    playData.setData((data) => {
        // -------------------------------------------
        // Tìm index quân đang di chuyển
        // -------------------------------------------

        const movingIndex =
            data.pieces.findIndex(
                p =>
                    p.id ===
                    movingPieceId
            );

        if (movingIndex === -1) {
            return;
        }

        // -------------------------------------------
        // Tìm quân địch ở ô đích
        // -------------------------------------------

        const enemyIndex =
            data.pieces.findIndex(
                p =>
                    p.position ===
                    targetPosition &&
                    p.color !==
                    data.pieces[movingIndex].color
            );

        // -------------------------------------------
        // ĂN QUÂN
        // -------------------------------------------
        //
        // KHÔNG dùng:
        //
        // data.pieces = data.pieces.filter(...)
        //
        // vì PlayHTML không cho reassign array
        // đang nằm trong tree.
        //
        // Dùng splice trực tiếp trên draft array.
        // -------------------------------------------

        if (enemyIndex !== -1) {
            data.pieces.splice(
                enemyIndex,
                1
            );
        }

        // -------------------------------------------
        // Tìm lại quân đang di chuyển
        // -------------------------------------------
        //
        // Vì splice có thể làm thay đổi index.
        // -------------------------------------------

        const newMovingIndex =
            data.pieces.findIndex(
                p =>
                    p.id ===
                    movingPieceId
            );

        if (newMovingIndex === -1) {
            return;
        }

        // -------------------------------------------
        // Di chuyển quân
        // -------------------------------------------

        data.pieces[
            newMovingIndex
        ].position =
            targetPosition;

        data.moveNumber++;

        // -------------------------------------------
        // Kiểm tra thắng
        // -------------------------------------------

        const winner =
            checkWinner(
                data,
                data.pieces[
                    newMovingIndex
                ]
            );

        if (winner) {
            data.winner =
                winner.color;

            data.winReason =
                winner.reason;

            return;
        }

        // -------------------------------------------
        // Đổi lượt
        // -------------------------------------------

        data.turn =
            data.turn === "blue"
                ? "red"
                : "blue";
    });

    selectedPieceId = null;
}

// =====================================================
// KIỂM TRA ĐI 1 Ô
// =====================================================

function isOneSquareMove(
    from,
    to
) {
    const fromCol =
        COLUMNS.indexOf(
            from[0]
        );

    const fromRow =
        Number(
            from.substring(1)
        );

    const toCol =
        COLUMNS.indexOf(
            to[0]
        );

    const toRow =
        Number(
            to.substring(1)
        );

    if (
        fromCol < 0 ||
        toCol < 0
    ) {
        return false;
    }

    const colDistance =
        Math.abs(
            fromCol - toCol
        );

    const rowDistance =
        Math.abs(
            fromRow - toRow
        );

    return (
        colDistance <= 1 &&
        rowDistance <= 1 &&
        (
            colDistance +
            rowDistance
        ) > 0
    );
}

// =====================================================
// LUẬT ĂN RPS
// =====================================================

function canCapture(
    attacker,
    defender
) {
    if (
        attacker ===
        defender
    ) {
        return false;
    }

    // 🪨 thắng ✂️
    if (
        attacker === "rock" &&
        defender === "scissors"
    ) {
        return true;
    }

    // ✂️ thắng 📄
    if (
        attacker === "scissors" &&
        defender === "paper"
    ) {
        return true;
    }

    // 📄 thắng 🪨
    if (
        attacker === "paper" &&
        defender === "rock"
    ) {
        return true;
    }

    return false;
}

// =====================================================
// KIỂM TRA THẮNG
// =====================================================

function checkWinner(
    state,
    movedPiece
) {
    const color =
        movedPiece.color;

    // -----------------------------------------------
    // Điều kiện 1:
    // Đi tới a1 hoặc i9
    // -----------------------------------------------

    if (
        movedPiece.position === "a9" ||
        movedPiece.position === "i1"
    ) {
        return {
            color,

            reason:
                `${color === "blue" ? "Xanh" : "Đỏ"} đã đưa quân tới ô đích.`
        };
    }

    // -----------------------------------------------
    // Điều kiện 2:
    // Đối phương mất toàn bộ một loại quân
    // -----------------------------------------------

    const enemyColor =
        color === "blue"
            ? "red"
            : "blue";

    const types = [
        "rock",
        "paper",
        "scissors"
    ];

    for (
        const type of types
    ) {
        const enemyHasType =
            state.pieces.some(
                piece =>
                    piece.color ===
                    enemyColor &&
                    piece.type ===
                    type
            );

        if (!enemyHasType) {
            return {
                color,

                reason:
                    `${color === "blue" ? "Xanh" : "Đỏ"} đã loại toàn bộ quân ${getPieceName(type)} của đối thủ.`
            };
        }
    }

    return null;
}

// =====================================================
// TÊN QUÂN
// =====================================================

function getPieceName(type) {
    if (type === "rock") {
        return "🪨";
    }

    if (type === "paper") {
        return "📄";
    }

    if (type === "scissors") {
        return "✂️";
    }

    return "";
}

// =====================================================
// HIỂN THỊ LƯỢT
// =====================================================

function renderTurn(state) {
    if (state.winner) {
        turnDisplay.textContent =
            `🏆 ${state.winner === "blue" ? "Xanh" : "Đỏ"} thắng`;
        return;
    }

    if (
        !state.players.blue ||
        !state.players.red
    ) {
        turnDisplay.textContent =
            "⏳ Đang chờ đủ 2 người chơi...";
        return;
    }

    if (
        state.turn === "blue"
    ) {
        turnDisplay.textContent =
            "🔵 Lượt của Xanh";
    } else {
        turnDisplay.textContent =
            "🔴 Lượt của Đỏ";
    }
}

// =====================================================
// STATUS
// =====================================================

function renderStatus(state) {
    if (state.winner) {
        statusDisplay.textContent =
            `🏆 ${
                state.winner === "blue"
                    ? state.playerNames.blue
                    : state.playerNames.red
            } thắng! ${state.winReason}`;

        return;
    }

    if (
        !state.players.blue ||
        !state.players.red
    ) {
        statusDisplay.textContent =
            "Phòng đang chờ người chơi.";

        return;
    }

    statusDisplay.textContent =
        `Nước đi: ${state.moveNumber}`;
}

// =====================================================
// TẠO PHÒNG
// =====================================================

createRoomBtn.addEventListener(
    "click",
    async () => {
        const name =
            nameInput.value.trim();

        const room =
            normalizeRoomCode(
                roomInput.value
            );

        if (!name) {
            alert(
                "Vui lòng nhập tên."
            );
            return;
        }

        if (!room) {
            alert(
                "Vui lòng nhập mã phòng."
            );
            return;
        }

        const registry =
            playhtml.createPageData(
                "ottv2-room-registry",
                {
                    rooms: {}
                }
            );

        const data =
            registry.getData();

        if (
            data.rooms &&
            data.rooms[room]
        ) {
            alert(
                "Mã phòng này đã tồn tại."
            );
            return;
        }

        registry.setData(
            (value) => {
                if (!value.rooms) {
                    value.rooms = {};
                }

                value.rooms[room] = {
                    createdAt:
                        Date.now(),

                    createdByName:
                        name
                };
            }
        );

        sessionStorage.setItem(
            "ottv2-name",
            name
        );

        const pid =
            createVisitId();

        window.location.href =
            `${window.location.pathname}?room=${encodeURIComponent(room)}&role=create&pid=${encodeURIComponent(pid)}`;
    }
);

// =====================================================
// VÀO PHÒNG
// =====================================================

joinRoomBtn.addEventListener(
    "click",
    async () => {
        const name =
            nameInput.value.trim();

        const room =
            normalizeRoomCode(
                roomInput.value
            );

        if (!name) {
            alert(
                "Vui lòng nhập tên."
            );
            return;
        }

        if (!room) {
            alert(
                "Vui lòng nhập mã phòng."
            );
            return;
        }

        const exists =
            await checkRoomExists(
                room
            );

        if (!exists) {
            alert(
                `Không tìm thấy phòng "${room}". Phòng chưa được tạo.`
            );
            return;
        }

        sessionStorage.setItem(
            "ottv2-name",
            name
        );

        const pid =
            createVisitId();

        window.location.href =
            `${window.location.pathname}?room=${encodeURIComponent(room)}&role=join&pid=${encodeURIComponent(pid)}`;
    }
);

// =====================================================
// XEM TRẬN
// =====================================================

watchRoomBtn.addEventListener(
    "click",
    async () => {
        const name =
            nameInput.value.trim();

        const room =
            normalizeRoomCode(
                roomInput.value
            );

        if (!name) {
            alert(
                "Vui lòng nhập tên."
            );
            return;
        }

        if (!room) {
            alert(
                "Vui lòng nhập mã phòng."
            );
            return;
        }

        const exists =
            await checkRoomExists(
                room
            );

        if (!exists) {
            alert(
                `Không tìm thấy phòng "${room}". Phòng chưa được tạo.`
            );
            return;
        }

        sessionStorage.setItem(
            "ottv2-name",
            name
        );

        const pid =
            createVisitId();

        window.location.href =
            `${window.location.pathname}?room=${encodeURIComponent(room)}&role=watch&pid=${encodeURIComponent(pid)}`;
    }
);

// =====================================================
// KIỂM TRA PHÒNG
// =====================================================

async function checkRoomExists(
    room
) {
    const registry =
        playhtml.createPageData(
            "ottv2-room-registry",
            {
                rooms: {}
            }
        );

    const data =
        registry.getData();

    return Boolean(
        data.rooms &&
        data.rooms[room]
    );
}

// =====================================================
// CHUẨN HÓA MÃ PHÒNG
// =====================================================

function normalizeRoomCode(
    value
) {
    return String(value || "")
        .trim()
        .toUpperCase()
        .replace(
            /\s+/g,
            "-"
        );
}

// =====================================================
// VỀ TRANG CHỦ
// =====================================================

backBtn.addEventListener(
    "click",
    () => {
        goHome();
    }
);

function goHome() {
    window.location.href =
        window.location.pathname;
}

// =====================================================
// START
// =====================================================

init().catch(
    (error) => {
        console.error(
            "Lỗi khởi động game:",
            error
        );

        alert(
            "Không thể kết nối PlayHTML. Hãy kiểm tra Internet và thử lại."
        );
    }
);