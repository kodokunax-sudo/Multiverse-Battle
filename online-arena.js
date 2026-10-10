/* Multiverse Battle — online arena test shell (entry/exit only). */
(function () {
    'use strict';

    var entered = false;

    function byId(id) { return document.getElementById(id); }

    function enterArena() {
        if (entered) return;
        var lobby = byId('onlineArenaLobby');
        var stage = byId('onlineArenaStage');
        var status = byId('onlineArenaStatusStage');
        if (!lobby || !stage) return;
        entered = true;
        lobby.style.display = 'none';
        stage.style.display = 'block';
        var signedInAs = byId('clansSignedInAs');
        var playerName = signedInAs && signedInAs.textContent.trim() ? signedInAs.textContent.trim() : 'Игрок';
        var playerLabel = byId('onlineArenaPlayerName');
        if (playerLabel) playerLabel.textContent = playerName;
        if (status) status.textContent = 'Ты вошёл на тестовую арену. Сейчас проверяются только вход и выход.';
        var exit = byId('onlineArenaExit');
        if (exit) exit.focus({ preventScroll: true });
    }

    function exitArena() {
        var lobby = byId('onlineArenaLobby');
        var stage = byId('onlineArenaStage');
        var status = byId('onlineArenaStatus');
        entered = false;
        if (stage) stage.style.display = 'none';
        if (lobby) lobby.style.display = 'block';
        if (status) status.textContent = 'Ты вышел с арены. Можно зайти снова.';
        var enter = byId('onlineArenaEnter');
        if (enter) enter.focus({ preventScroll: true });
    }

    function init() {
        var enter = byId('onlineArenaEnter');
        var exit = byId('onlineArenaExit');
        if (enter) enter.addEventListener('click', enterArena);
        if (exit) exit.addEventListener('click', exitArena);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();