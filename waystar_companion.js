/* Waystar companion: returns for every eligible Living Stone phase-two encounter.
   The existing slotData.waystarOwesDebt value remains the sole mercy source. */
(function () {
    "use strict";

    var active = false, supportRequested = false, frame = 0, activeEncounterGeneration = -1;
    var strikeTimer = 95, guardCooldown = 0;
    var guardFlash = 0, strikeFlash = 0, supportDimTimer = 0, attackPause = 0;
    var supportX = 0, supportY = 0;
    var route = null, routeTimer = 0, routeHitFlash = 0;
    var blockStars = 0, constellationFlash = 0;
    var finalLockTimer = 0, finalLockTriggered = false, finalDialogueStage = 0;
    var lastPhase = "";

    // Independent Waystar NPC, built around Oden's movement / dodge / attack loop.
    var ally = {
        x: 200, y: 300, vx: 0, vy: 0, hp: 150, maxHp: 150,
        phase: 0, invuln: 0, hitFlash: 0, attackTimer: 125,
        attackPattern: 0, alive: true, targetX: 200, targetY: 300,
        windup: 0, dashFlash: 0
    };
    var allyAttacks = [], allyParticles = [], allyDeathTimer = 0;
    var allyAttackSerial = 0;
    var WAYSTAR_ALLY_SPEED = 5.2;

    function resetAlly() {
        ally.x = 200; ally.y = 300; ally.vx = 0; ally.vy = 0;
        ally.hp = ally.maxHp = 150; ally.phase = 0; ally.invuln = 0;
        ally.hitFlash = 0; ally.attackTimer = 105; ally.attackPattern = 0;
        ally.alive = true; ally.targetX = 200; ally.targetY = 300;
        ally.windup = 0; ally.dashFlash = 0; allyDeathTimer = 0;
        allyAttacks.length = 0; allyParticles.length = 0; allyAttackSerial = 0;
    }

    function bossPoint() {
        if (typeof livingStoneBoss === "undefined" || !livingStoneBoss) return { x: 200, y: 110, size: 42, vx: 0, vy: 0 };
        return {
            x: Number(livingStoneBoss.x) || 200,
            y: Number(livingStoneBoss.y) || 110,
            size: Math.max(20, Number(livingStoneBoss.size) || 42),
            vx: Number(livingStoneBoss.vx) || 0,
            vy: Number(livingStoneBoss.vy) || 0
        };
    }

    function allyDamageAmount(weight) {
        // Each shard is a small hit. Whole patterns add up to Oden-like steady support DPS.
        return Math.max(1, Math.floor(maxBossHp() * 0.0007 * (Number(weight) || 1)));
    }

    function hitBoss(amount, x, y, color) {
        if (!ally.alive || !normalActionsEligible() && !encounterEligible()) return false;
        if (!(currentBossHp() > 0)) return false;
        var dealt = Math.min(Math.max(1, Math.floor(Number(amount) || 1)), Math.max(1, currentBossHp()));
        var applied = false;
        if (typeof window.MBLivingStoneSuperDamage === "function" && window.livingStoneSuperActive === true) {
            applied = window.MBLivingStoneSuperDamage(dealt) !== false;
        } else if (typeof damageLivingStone === "function") {
            damageLivingStone(dealt); applied = true;
        }
        if (!applied) return false;
        strikeFlash = Math.max(strikeFlash, 18);
        if (typeof spawnLivingStoneParticles === "function")
            spawnLivingStoneParticles(Number(x) || bossPoint().x, Number(y) || bossPoint().y,
                6, color || "#aeeaff", 3.2);
        if (typeof playArenaSound === "function") playArenaSound(720 + Math.random() * 300, "triangle", 0.07, 0.035);
        return true;
    }

    function pushAllyShot(type, x, y, vx, vy, size, weight, color, life, curve) {
        allyAttacks.push({
            type: type, x: x, y: y, vx: vx, vy: vy,
            size: size || 7, damage: allyDamageAmount(weight),
            color: color || "#dffaff", life: life || 100,
            trail: [], curve: Number(curve) || 0, spin: Math.random() < 0.5 ? -1 : 1,
            rotation: Math.atan2(vy, vx), hit: false
        });
    }

    function launchAllyPattern() {
        if (!ally.alive || !encounterEligible() || currentBossHp() <= 0) return;
        var boss = bossPoint();
        var tx = Math.max(35, Math.min(365, boss.x + boss.vx * 9));
        var ty = Math.max(65, Math.min(230, boss.y + boss.vy * 7));
        var dx = tx - ally.x, dy = ty - ally.y;
        var base = Math.atan2(dy, dx);
        var pattern = ally.attackPattern++ % 9;
        allyAttackSerial++;
        ally.windup = pattern === 2 || pattern === 5 || pattern === 6 ? 24 : 9;

        if (pattern === 0) {
            // METEOR VOLLEY: the same falling star-rocks used in her original fight.
            for (var i = -1; i <= 1; i++) {
                var a = base + i * 0.19;
                pushAllyShot("meteor", ally.x + i * 10, ally.y - 8,
                    Math.cos(a) * 5.7, Math.sin(a) * 5.7, 11, 1.05, "#ffd45b", 110, 0.012);
            }
            announce("МЕТЕОРИТНЫЙ ЗАЛП!", "#ffe28b", 42);
        } else if (pattern === 1) {
            // SPIRAL: two counter-rotating strings of star fragments.
            for (var j = 0; j < 8; j++) {
                var a2 = base + (j - 3.5) * 0.16 + Math.sin(j * 0.8) * 0.12;
                pushAllyShot("spiral", ally.x, ally.y,
                    Math.cos(a2) * 5.0, Math.sin(a2) * 5.0, 7, 0.82, "#ff65ed", 100, j % 2 ? 0.035 : -0.035);
            }
            announce("ЗВЁЗДНЫЙ ВИХРЬ!", "#ff9cf4", 42);
        } else if (pattern === 2) {
            // GIANT LASER: visible charge line followed by a concentrated beam.
            allyAttacks.push({
                type: "beam", x1: ally.x, y1: ally.y, x2: tx, y2: ty,
                timer: 26, activeTimer: 22, warning: true,
                width: 19, damage: allyDamageAmount(0.68), tick: 0,
                color: "#ffeaff", hit: false
            });
            announce("ГИГА-ЛАЗЕР!", "#ffcaff", 50);
        } else if (pattern === 3) {
            // STAR RAIN: crossing stars sweep through the target's lane.
            for (var k = -2; k <= 2; k++) {
                var sx = Math.max(26, Math.min(374, tx + k * 25));
                var sy = Math.max(80, Math.min(250, ty - 75 - Math.abs(k) * 8));
                var adx = tx - sx, ady = ty - sy, al = Math.max(1, Math.hypot(adx, ady));
                pushAllyShot("star_rain", sx, sy, adx / al * 6.2, ady / al * 6.2,
                    8, 0.72, "#fff09a", 90, 0.008);
            }
            announce("ЗВЁЗДНЫЙ ДОЖДЬ!", "#fff0a6", 42);
        } else if (pattern === 4) {
            // SHOTGUN: the close-range fan from Waystar's third phase.
            for (var m = -3; m <= 3; m++) {
                var a3 = base + m * 0.115;
                pushAllyShot("shotgun_bullet", ally.x, ally.y,
                    Math.cos(a3) * 7.1, Math.sin(a3) * 7.1, 6, 0.7, "#ff6b55", 85, 0);
            }
            announce("ЗАЛП ОСКОЛКОВ!", "#ffac92", 42);
        } else if (pattern === 5) {
            // SOLAR BOMBS: warning circles, then separate radial explosions.
            for (var n = -1; n <= 1; n++) {
                allyAttacks.push({
                    type: "bomb", x: Math.max(35, Math.min(365, tx + n * 34)),
                    y: Math.max(70, Math.min(245, ty + Math.abs(n) * 18)),
                    timer: 38 + Math.abs(n) * 8, radius: 45,
                    damage: allyDamageAmount(0.95), color: "#ffb84b", exploded: false
                });
            }
            announce("СОЛНЕЧНЫЕ БОМБЫ!", "#ffd27b", 48);
        } else if (pattern === 6) {
            // STAR DASH: fast line strike; the NPC itself remains independently controlled.
            allyAttacks.push({
                type: "dash", x1: ally.x, y1: ally.y, x2: tx, y2: ty,
                timer: 20, damage: allyDamageAmount(1.75), color: "#baf5ff",
                width: 25, hit: false
            });
            ally.dashFlash = 24;
            announce("ЗВЁЗДНЫЙ РЫВОК!", "#d7faff", 45);
        } else if (pattern === 7) {
            // BLINDING FLASH: the four-corner warning pattern from her original first phase.
            allyAttacks.push({
                type: "blind", x: tx, y: ty, timer: 34,
                damage: allyDamageAmount(0.92), color: "#f4efff",
                pulse: 0, stunned: false
            });
            announce("ОСЛЕПЛЕНИЕ!", "#f1eaff", 48);
        } else {
            // THE LEGION: twelve fragments echo the original 60-piece formation.
            for (var q = 0; q < 12; q++) {
                var a4 = base + q * Math.PI * 2 / 12;
                var sp = 4.5 + (q % 3) * 0.7;
                pushAllyShot("legion", ally.x, ally.y,
                    Math.cos(a4) * sp, Math.sin(a4) * sp, 5.5, 0.58, q % 2 ? "#ff84e9" : "#ffe47c", 105, q % 2 ? 0.022 : -0.022);
            }
            announce("Я - ЛЕГИОН!", "#ffe9a0", 48);
        }
    }

    function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
        var t = len2 > 0 ? Math.max(0, Math.min(1, ((px-x1)*dx+(py-y1)*dy)/len2)) : 0;
        return Math.hypot(px-(x1+dx*t), py-(y1+dy*t));
    }

    function getAllyThreats() {
        var list = [];
        if (typeof livingStoneAttacks !== "undefined" && Array.isArray(livingStoneAttacks))
            list = list.concat(livingStoneAttacks);
        if (typeof livingStoneBullets !== "undefined" && Array.isArray(livingStoneBullets))
            list = list.concat(livingStoneBullets);
        if (typeof window.MBGetLivingStoneSuperCompanionThreats === "function") {
            try { list = list.concat(window.MBGetLivingStoneSuperCompanionThreats() || []); } catch (e) {}
        }
        return list;
    }

    function threatAt(h, x, y, frames, actual) {
        if (!h || h.allyHit || h.odenHit || h._mbGEIgnored || h.state === "done") return 0;
        var type = String(h.type || "").toLowerCase();
        var width = Math.max(8, Number(h.width) || 0);
        var radius = Math.max(7, Number(h.size || h.r || h.radius) || 9) + 12;
        var warning = h.state === "warning" || h.state === "windup" ||
            Number(h.warningTimer) > 0 || Number(h.delay) > 0;
        if (warning && actual) return 0;
        if ((type.indexOf("laser") !== -1 || type.indexOf("beam") !== -1) &&
            Number.isFinite(Number(h.x)) && (!Number.isFinite(Number(h.y)) || type === "laser")) {
            var laserX = Number(h.x);
            return Math.abs(x - laserX) < width * 0.5 + 18 ? 1 : 0;
        }
        if (type === "boss_dash" && Number.isFinite(Number(h.targetX))) {
            return pointToSegmentDistance(x, y, Number(h.x), Number(h.y),
                Number(h.targetX), Number(h.targetY)) < radius + 20 ? 1 : 0;
        }
        if (type === "predict") {
            return Math.hypot(x - Number(h.x), y - Number(h.y)) < Math.max(radius, Number(h.radius) || 0) ? 1 : 0;
        }
        if (!Number.isFinite(Number(h.x)) || !Number.isFinite(Number(h.y))) {
            if (Number.isFinite(Number(h.targetX)) && Math.abs(x - Number(h.targetX)) < width * 0.5 + 20) return 1;
            return 0;
        }
        var vx = Number(h.vx) || 0, vy = Number(h.vy) || 0;
        var px = Number(h.x) + vx * frames, py = Number(h.y) + vy * frames;
        if (type === "boomerang" && h.stage === "return") {
            px = Number(h.x) - vx * frames * 0.8;
            py = Number(h.y) - vy * frames * 0.8;
        }
        return Math.hypot(x - px, y - py) < radius + (warning ? 24 : 0) ? 1 : 0;
    }

    function chooseAllyGoal(boss, threats) {
        var baseX = Math.max(35, Math.min(365, boss.x + (ally.x <= boss.x ? -54 : 54)));
        var baseY = Math.max(205, Math.min(365, boss.y + 160));
        var nearest = null, nearestScore = Infinity;
        var candidates = [{x:baseX,y:baseY}];
        for (var a = 0; a < 12; a++) {
            var angle = a * Math.PI / 6;
            for (var rad = 48; rad <= 112; rad += 32) {
                candidates.push({
                    x: Math.max(28, Math.min(372, ally.x + Math.cos(angle) * rad)),
                    y: Math.max(170, Math.min(410, ally.y + Math.sin(angle) * rad))
                });
            }
        }
        var timeChecks = [0, 12, 24, 38];
        for (var i = 0; i < candidates.length; i++) {
            var cand = candidates[i], danger = 0;
            for (var j = 0; j < threats.length; j++) {
                for (var t = 0; t < timeChecks.length; t++) {
                    if (threatAt(threats[j], cand.x, cand.y, timeChecks[t], false)) {
                        danger += (4 - t) * (Number(threats[j].damage) > 16 ? 7 : 4);
                        break;
                    }
                }
            }
            var score = danger * 1000 + Math.hypot(cand.x-baseX,cand.y-baseY) * 0.28 +
                Math.hypot(cand.x-ally.x,cand.y-ally.y) * 0.045;
            if (score < nearestScore) { nearestScore = score; nearest = cand; }
        }
        return nearest || { x: baseX, y: baseY };
    }

    function damageAlly(amount, x, y) {
        if (!ally.alive || ally.invuln > 0) return;
        var dealt = Math.max(1, Math.min(22, Number(amount) || 8));
        ally.hp = Math.max(0, ally.hp - dealt);
        ally.invuln = 38; ally.hitFlash = 15;
        burst(x || ally.x, y || ally.y, 12, "#ff91c9", 4);
        if (ally.hp <= 0) {
            ally.alive = false; allyDeathTimer = 240;
            announce("ПУТЕВОДНАЯ ЗВЕЗДА ВЫБЫЛА!", "#ff9acb", 90);
        }
    }

    function updateAlly() {
        if (!ally.alive) {
            if (allyDeathTimer > 0) allyDeathTimer--;
            return;
        }
        var boss = bossPoint(), threats = getAllyThreats();
        ally.phase += 0.11;
        if (ally.invuln > 0) ally.invuln--;
        if (ally.hitFlash > 0) ally.hitFlash--;
        if (ally.dashFlash > 0) ally.dashFlash--;
        if (attackPause <= 0) {
            if (ally.attackTimer > 0) ally.attackTimer--;
            if (ally.attackTimer <= 0) {
                ally.attackTimer = 138;
                launchAllyPattern();
            }
        }

        var goal = chooseAllyGoal(boss, threats);
        var immediate = null, immediateScore = Infinity;
        for (var i = 0; i < threats.length; i++) {
            var h = threats[i];
            if (!h || h.state === "done") continue;
            var risk = threatAt(h, ally.x, ally.y, 14, false);
            if (risk) {
                var d = Math.hypot(ally.x-(Number(h.x)||ally.x), ally.y-(Number(h.y)||ally.y));
                var score = d - Math.max(0, Number(h.damage)||0)*0.35;
                if (score < immediateScore) { immediateScore = score; immediate = h; }
            }
        }
        if (immediate) {
            var hx = Number(immediate.x) || ally.x, hy = Number(immediate.y) || ally.y;
            var awayX = ally.x - hx, awayY = ally.y - hy, len = Math.hypot(awayX,awayY) || 1;
            goal = {
                x: Math.max(26, Math.min(374, ally.x + awayX / len * 105 + (Math.random()-0.5)*18)),
                y: Math.max(160, Math.min(420, ally.y + awayY / len * 92))
            };
        }

        ally.targetX = goal.x; ally.targetY = goal.y;
        var dx = goal.x - ally.x, dy = goal.y - ally.y, dist = Math.hypot(dx,dy) || 1;
        var desired = Math.min(WAYSTAR_ALLY_SPEED, Math.max(0.5, dist * 0.18));
        var steer = immediate ? 0.34 : 0.19;
        ally.vx += (dx / dist * desired - ally.vx) * steer;
        ally.vy += (dy / dist * desired - ally.vy) * steer;
        var speed = Math.hypot(ally.vx,ally.vy);
        if (speed > WAYSTAR_ALLY_SPEED) { ally.vx = ally.vx/speed*WAYSTAR_ALLY_SPEED; ally.vy = ally.vy/speed*WAYSTAR_ALLY_SPEED; }
        ally.x = Math.max(22, Math.min(378, ally.x + ally.vx));
        ally.y = Math.max(160, Math.min(430, ally.y + ally.vy));

        for (var j = 0; j < threats.length; j++) {
            var h2 = threats[j];
            if (!h2 || h2.allyHit) continue;
            var hit = threatAt(h2, ally.x, ally.y, 0, true);
            if (hit && ally.invuln <= 0) {
                h2.allyHit = true;
                damageAlly(Math.max(6, (Number(h2.damage)||12)*0.48), ally.x, ally.y);
                break;
            }
        }

        // Advance Waystar's own original-style projectiles and attacks.
        for (var k = allyAttacks.length - 1; k >= 0; k--) {
            var a = allyAttacks[k];
            if (a.type === "beam") {
                if (a.timer > 0) a.timer--;
                else if (a.activeTimer > 0) {
                    a.activeTimer--; a.tick++;
                    if (a.tick % 5 === 0 && !a.hit &&
                        pointToSegmentDistance(boss.x,boss.y,a.x1,a.y1,a.x2,a.y2) < boss.size + a.width) {
                        hitBoss(a.damage, boss.x, boss.y, "#fff0ff"); a.hit = a.activeTimer > 0;
                    }
                } else { allyAttacks.splice(k,1); }
                continue;
            }
            if (a.type === "bomb") {
                a.timer--;
                if (a.timer <= 0) {
                    if (!a.exploded) {
                        a.exploded = true;
                        if (Math.hypot(boss.x-a.x,boss.y-a.y) < a.radius + boss.size)
                            hitBoss(a.damage,a.x,a.y,a.color);
                        burst(a.x,a.y,18,a.color,5);
                    }
                    allyAttacks.splice(k,1);
                }
                continue;
            }
            if (a.type === "dash") {
                a.timer--;
                if (a.timer <= 0) {
                    if (!a.hit && pointToSegmentDistance(boss.x,boss.y,a.x1,a.y1,a.x2,a.y2) < boss.size + a.width)
                        hitBoss(a.damage,boss.x,boss.y,a.color);
                    allyAttacks.splice(k,1);
                }
                continue;
            }
            if (a.type === "blind") {
                a.timer--; a.pulse++;
                if (!a.stunned && a.timer <= 14) {
                    a.stunned = true;
                    if (typeof window.MBLivingStoneSuperCompanionStun === "function")
                        window.MBLivingStoneSuperCompanionStun(42);
                    hitBoss(a.damage,boss.x,boss.y,a.color);
                }
                if (a.timer <= 0) allyAttacks.splice(k,1);
                continue;
            }
            a.trail.push({x:a.x,y:a.y});
            if (a.trail.length > 6) a.trail.shift();
            if (a.curve) {
                var ang = Math.atan2(a.vy,a.vx) + a.curve * a.spin;
                var spd = Math.max(2,Math.hypot(a.vx,a.vy));
                a.vx = Math.cos(ang)*spd; a.vy = Math.sin(ang)*spd;
            }
            a.x += a.vx; a.y += a.vy; a.rotation += 0.12; a.life--;
            if (Math.hypot(boss.x-a.x,boss.y-a.y) < boss.size + a.size) {
                hitBoss(a.damage,a.x,a.y,a.color);
                burst(a.x,a.y,5,a.color,2.8);
                allyAttacks.splice(k,1);
                continue;
            }
            if (a.life <= 0 || a.x < -30 || a.x > 430 || a.y < -35 || a.y > 535)
                allyAttacks.splice(k,1);
        }
    }

    function drawAllyAttacks(c) {
        c.save();
        for (var i = 0; i < allyAttacks.length; i++) {
            var a = allyAttacks[i];
            if (a.type === "beam" || a.type === "dash") {
                c.save();
                var activeBeam = a.type === "dash" || a.timer <= 0;
                c.globalAlpha = activeBeam ? 0.92 : 0.28 + Math.sin(frame/2)*0.12;
                c.strokeStyle = a.color; c.lineWidth = activeBeam ? (a.width || 18) : 3;
                c.shadowColor = a.color; c.shadowBlur = 14;
                c.beginPath(); c.moveTo(a.x1,a.y1); c.lineTo(a.x2,a.y2); c.stroke();
                c.strokeStyle = "#ffffff"; c.lineWidth = activeBeam ? 3 : 1;
                c.beginPath(); c.moveTo(a.x1,a.y1); c.lineTo(a.x2,a.y2); c.stroke();
                c.restore();
            } else if (a.type === "blind") {
                c.save();
                c.globalAlpha = Math.min(0.95, (34-a.timer)/8) * 0.9;
                c.strokeStyle = "#f8efff"; c.lineWidth = 3;
                c.shadowColor = "#eacbff"; c.shadowBlur = 18;
                for (var corner = 0; corner < 4; corner++) {
                    var ca = corner * Math.PI/2 + frame*0.025;
                    var cx = a.x + Math.cos(ca)*58, cy = a.y + Math.sin(ca)*58;
                    c.beginPath(); c.arc(cx,cy,12+a.pulse%9,0,Math.PI*2); c.stroke();
                    c.beginPath(); c.moveTo(cx-Math.cos(ca)*16,cy-Math.sin(ca)*16);
                    c.lineTo(cx+Math.cos(ca)*16,cy+Math.sin(ca)*16); c.stroke();
                }
                c.restore();
            } else if (a.type === "bomb") {
                c.save(); c.globalAlpha = 0.45 + Math.sin(frame/3)*0.22;
                c.strokeStyle = a.color; c.lineWidth = 2; c.shadowColor = a.color; c.shadowBlur = 10;
                c.beginPath(); c.arc(a.x,a.y,a.radius*(1-a.timer/50),0,Math.PI*2); c.stroke();
                c.fillStyle = "rgba(255,210,100,.18)"; c.beginPath(); c.arc(a.x,a.y,Math.max(4,a.radius*(1-a.timer/50)),0,Math.PI*2); c.fill();
                c.restore();
            } else {
                for (var j = 0; j < a.trail.length; j++) {
                    c.globalAlpha = (j+1)/a.trail.length*0.34;
                    c.fillStyle = a.color; c.beginPath();
                    c.arc(a.trail[j].x,a.trail[j].y,a.size*(j+1)/a.trail.length*0.65,0,Math.PI*2); c.fill();
                }
                c.save(); c.globalAlpha = 1; c.translate(a.x,a.y); c.rotate(a.rotation || 0);
                c.fillStyle = a.color; c.strokeStyle = "#ffffff"; c.lineWidth = 1.2;
                c.shadowColor = a.color; c.shadowBlur = 9;
                c.beginPath();
                for (var p = 0; p < 10; p++) {
                    var angle = -Math.PI/2 + p*Math.PI/5, radius = p%2===0 ? a.size : a.size*0.4;
                    var xx=Math.cos(angle)*radius, yy=Math.sin(angle)*radius;
                    if(p===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
                }
                c.closePath(); c.fill(); c.stroke(); c.restore();
            }
        }
        c.restore();
    }

    function drawAllyStatus(c) {
        if (!ally.alive) {
            c.save(); c.font="bold 10px Arial"; c.textAlign="center";
            c.fillStyle="#ff9acb"; c.shadowColor="#ff40a0"; c.shadowBlur=8;
            c.fillText("ПУТЕВОДНАЯ ЗВЕЗДА ВЫБЫЛА",ally.x,ally.y-28); c.restore();
            return;
        }
        c.save();
        var barW=42, barX=ally.x-barW/2, barY=ally.y-34;
        c.fillStyle="rgba(0,0,0,.72)"; c.fillRect(barX-2,barY-3,barW+4,7);
        c.fillStyle="#26132b"; c.fillRect(barX,barY,barW,3);
        c.fillStyle=ally.hp>ally.maxHp*.3?"#a5f4ff":"#ff83bb";
        c.fillRect(barX,barY,barW*Math.max(0,ally.hp/ally.maxHp),3);
        if (ally.hitFlash > 0) {
            c.strokeStyle="#ffffff"; c.lineWidth=2; c.globalAlpha=ally.hitFlash/15;
            c.beginPath(); c.arc(ally.x,ally.y,30,0,Math.PI*2); c.stroke();
        }
        c.restore();
    }

    function wasSpared() {
        try {
            var savedValue = (typeof slotData !== "undefined" && slotData) ? slotData.waystarOwesDebt : false;
            var legacyValue = (typeof slotData !== "undefined" && slotData) ? slotData.waystarDefeatedThisRun : false;
            return window.waystarOwesDebt === true || savedValue === true || savedValue === 1 || savedValue === "true" ||
                window.waystarDefeatedThisRun === true || legacyValue === true || legacyValue === 1 || legacyValue === "true";
        } catch (e) { return false; }
    }

    function phase() {
        return (typeof window !== "undefined" && window.__mbLS2GreenPhase) || "normal";
    }

    function encounterEligible() {
        // The spared Star is reserved exclusively for Living Stone Prime.
        // Ordinary Living Stone must never activate or display this companion.
        if (!wasSpared() ||
            typeof livingStoneActive === "undefined" || !livingStoneActive ||
            window.livingStoneSuperActive !== true ||
            window.__mbLS2AfterChase !== true ||
            (typeof finalSceneActive !== "undefined" && finalSceneActive) ||
            window.__mbLivingStoneChaseActive === true) return false;

        return phase() === "normal" || phase() === "green";
    }

    function normalActionsEligible() {
        return encounterEligible() && phase() === "normal";
    }

    function announce(message, color, life) {
        if (typeof spawnLivingStoneText === "function")
            spawnLivingStoneText(200, 305, message, color || "#bcefff", life || 70);
    }

    function burst(x, y, count, color, speed) {
        if (typeof spawnLivingStoneParticles === "function")
            spawnLivingStoneParticles(x, y, count, color || "#aeeaff", speed || 4);
    }

    function maxBossHp() {
        var hp = 0;
        if (window.livingStoneSuperActive === true && typeof window.getLivingStoneSuperBossMaxHp === "function") {
            try { hp = Number(window.getLivingStoneSuperBossMaxHp()) || 0; } catch (e) {}
        }
        if (!(hp > 0) && typeof livingStoneBossMaxHp !== "undefined") hp = Number(livingStoneBossMaxHp) || 0;
        return Math.max(1, hp);
    }

    function currentBossHp() {
        if (typeof livingStoneBossHp !== "undefined" && Number.isFinite(Number(livingStoneBossHp)))
            return Number(livingStoneBossHp);
        return maxBossHp();
    }

    function startSupport() {
        if (!wasSpared() || window.livingStoneSuperActive !== true) return false;
        supportRequested = true;
        active = false;
        frame = 0;
        strikeTimer = 95;
        guardCooldown = 0;
        guardFlash = 0;
        strikeFlash = 0;
        supportDimTimer = 0;
        attackPause = 0;
        route = null;
        routeTimer = 0;
        routeHitFlash = 0;
        blockStars = 0;
        constellationFlash = 0;
        finalLockTimer = 0;
        finalLockTriggered = false;
        finalDialogueStage = 0;
        lastPhase = "";
        resetAlly();
        return true;
    }

    function strike() {
        if (!normalActionsEligible() || attackPause > 0 ||
            typeof livingStoneBoss === "undefined" || !livingStoneBoss) return;
        var damage = Math.min(Math.max(1, Math.floor(maxBossHp() * 0.012)), Math.max(0, currentBossHp() - 1));
        if (!(damage > 0)) return;
        if (typeof damageLivingStone === "function") damageLivingStone(damage);
        else if (typeof window.MBLivingStoneSuperDamage === "function") window.MBLivingStoneSuperDamage(damage);
        else return;

        strikeFlash = 42;
        burst(livingStoneBoss.x || 200, livingStoneBoss.y || 110, 18, "#aeeaff", 5);
        announce("ЗВЁЗДНЫЙ УДАР!", "#bcefff", 48);
        if (typeof playArenaSound === "function") playArenaSound(960, "sine", 0.22, 0.075);
    }

    function beginFinalLock() {
        if (finalLockTriggered || !normalActionsEligible() ||
            typeof window.MBLivingStoneSuperWaystarFinalLock !== "function") return;
        var started = window.MBLivingStoneSuperWaystarFinalLock(165);
        if (started === false) return;

        finalLockTriggered = true;
        finalLockTimer = 165;
        finalDialogueStage = 1;
        route = null;
        routeTimer = 0;
        announce("В ПРОШЛЫЙ РАЗ ТЫ НЕ ДАЛ МНЕ ПРОИГРАТЬ...", "#d8f5ff", 105);
        burst(livingStoneBoss.x || 200, livingStoneBoss.y || 110, 26, "#b8edff", 5);
        if (typeof playArenaSound === "function") playArenaSound(1180, "sine", 0.42, 0.09);
    }

    function update() {
        if (!encounterEligible()) {
            active = false;
            if (guardFlash > 0) guardFlash--;
            if (strikeFlash > 0) strikeFlash--;
            return;
        }

        var generation = typeof livingStoneEncounterGeneration !== "undefined"
            ? Number(livingStoneEncounterGeneration) || 0 : 0;
        if (!active || activeEncounterGeneration !== generation) {
            active = true;
            supportRequested = true;
            activeEncounterGeneration = generation;
            frame = 0;
            strikeTimer = 95;
            guardCooldown = 0;
            guardFlash = 0;
            strikeFlash = 0;
            supportDimTimer = 0;
            attackPause = 0;
            route = null;
            routeTimer = 0;
            routeHitFlash = 0;
            blockStars = 0;
            constellationFlash = 0;
            finalLockTimer = 0;
            finalLockTriggered = false;
            finalDialogueStage = 0;
            lastPhase = "";
            resetAlly();
            supportX = Number(livingStonePlayer.x) || 200;
            supportY = Number(livingStonePlayer.y) || 400;
            announce("Я ОБЕЩАЛА ВЕРНУТЬСЯ. И Я ЗДЕСЬ.", "#bcefff", 95);
        }

        frame++;
        var currentPhase = phase();
        if (lastPhase === "green" && currentPhase !== "green") {
            blockStars = 0;
            constellationFlash = 0;
        }
        lastPhase = currentPhase;

        if (currentPhase === "normal") {
            if (guardCooldown > 0) guardCooldown--;
            if (strikeTimer > 0) strikeTimer--;
            if (attackPause > 0) attackPause--;
            if (routeTimer > 0) routeTimer--;
            if (routeHitFlash > 0) routeHitFlash--;
            if (supportDimTimer > 0) supportDimTimer--;
            if (finalLockTimer > 0) {
                finalLockTimer--;
                if (finalDialogueStage === 1 && finalLockTimer <= 95) {
                    finalDialogueStage = 2;
                    announce("ТЕПЕРЬ Я НЕ ДАМ ТЕБЕ ЗАБРАТЬ ЕГО ПОБЕДУ!", "#d8f5ff", 95);
                }
            }
            if (routeTimer <= 0) route = null;

            var hpRatio = currentBossHp() / maxBossHp();
            if (hpRatio <= 0.12 && !finalLockTriggered) beginFinalLock();
        } else {
            // In green-heart mode the player-facing protection pauses, but the Star keeps fighting.
            route = null;
            routeTimer = 0;
            if (constellationFlash > 0) {
                constellationFlash--;
                if (constellationFlash <= 0) blockStars = 0;
            }
            if (routeHitFlash > 0) routeHitFlash--;
        }

        if (guardFlash > 0) guardFlash--;
        if (strikeFlash > 0) strikeFlash--;
        updateAlly();
        supportX = ally.x;
        supportY = ally.y;
    }

    function tryProtect(incoming) {
        if (!normalActionsEligible() || guardCooldown > 0) return false;

        incoming = Math.max(0, Number(incoming) || 0);
        var hp = typeof livingStonePlayerHp !== "undefined" ? Number(livingStonePlayerHp) : 0;
        var maxHp = typeof livingStonePlayerMaxHp !== "undefined" ? Number(livingStonePlayerMaxHp) : hp;
        if (!(hp > 0) || !(maxHp > 0)) return false;

        var remainingHp = hp - incoming;
        var critical = remainingHp <= 0 || remainingHp <= maxHp * 0.22;
        if (!critical) return false;

        guardCooldown = 900;
        guardFlash = 64;
        if (typeof livingStoneInvulnTimer !== "undefined") livingStoneInvulnTimer = 55;
        supportDimTimer = 240;
        attackPause = 240;
        strikeTimer = Math.max(strikeTimer, 240);
        route = null;
        routeTimer = 0;

        if (typeof livingStonePlayer !== "undefined" && livingStonePlayer &&
            typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            var dx = livingStonePlayer.x - livingStoneBoss.x;
            var dy = livingStonePlayer.y - livingStoneBoss.y;
            var length = Math.sqrt(dx * dx + dy * dy) || 1;
            livingStonePlayer.x = Math.max(18, Math.min(382, livingStonePlayer.x + dx / length * 12));
            livingStonePlayer.y = Math.max(82, Math.min(482, livingStonePlayer.y + dy / length * 12));
            supportX = livingStonePlayer.x + dx / length * 18;
            supportY = livingStonePlayer.y + dy / length * 18;
        }

        burst(livingStonePlayer.x, livingStonePlayer.y, 24, "#9deaff", 5);
        announce("НА ЭТОТ РАЗ Я УСПЕЛА!", "#d8f5ff", 90);
        if (typeof playArenaSound === "function") playArenaSound(620, "triangle", 0.35, 0.08);
        return true;
    }

    function onDodgePrediction(from, target) {
        if (!normalActionsEligible() || !from || !target) return false;
        var fromX = Number(from.x), fromY = Number(from.y);
        var targetX = Number(target.x), targetY = Number(target.y);
        if (![fromX, fromY, targetX, targetY].every(Number.isFinite)) return false;
        route = { fromX: fromX, fromY: fromY, targetX: targetX, targetY: targetY };
        routeTimer = 190;
        return true;
    }

    function tryRouteHit(bullet, boss) {
        if (!normalActionsEligible() || !route || routeTimer <= 0 || !bullet || !boss) return false;
        var bossDistance = Math.hypot(Number(boss.x) - route.targetX, Number(boss.y) - route.targetY);
        var bulletDistance = Math.hypot(Number(bullet.x) - route.targetX, Number(bullet.y) - route.targetY);
        if (bossDistance > 58 || bulletDistance > 66) return false;
        route = null;
        routeTimer = 0;
        routeHitFlash = 42;
        return true;
    }

    function onGreenBlock() {
        if (!encounterEligible() || phase() !== "green" || constellationFlash > 0) return false;
        blockStars = Math.min(3, blockStars + 1);
        burst(supportX, supportY, 5, "#baf4ff", 2.5);
        if (blockStars >= 3) {
            constellationFlash = 95;
            announce("ДА! ВОТ ТАК!", "#d8f5ff", 75);
            if (typeof playArenaSound === "function") playArenaSound(1040, "triangle", 0.2, 0.07);
            return true;
        }
        return false;
    }

    function resetGreenBlocks() {
        blockStars = 0;
        constellationFlash = 0;
    }

    function drawStar(c, x, y, radius, rotation, color) {
        c.save();
        c.translate(x, y);
        c.rotate(rotation || 0);
        c.beginPath();
        for (var i = 0; i < 8; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 4;
            var r = i % 2 === 0 ? radius : radius * 0.38;
            var px = Math.cos(a) * r, py = Math.sin(a) * r;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = color || "#dff8ff";
        c.shadowColor = color || "#a8eaff";
        c.shadowBlur = 10;
        c.fill();
        c.restore();
    }

    function draw(c) {
        if (!active || !encounterEligible() || !c ||
            typeof livingStonePlayer === "undefined" ||
            typeof window.MBDrawWaystarCompanion !== "function") return;

        var now = typeof performance !== "undefined" ? performance.now() : Date.now();
        var pulse = 1 + Math.sin(now / 135) * 0.1;
        var px = livingStonePlayer.x, py = livingStonePlayer.y;
        var sx = ally.x || supportX || px + 35, sy = ally.y || supportY || py - 22;
        var isGreen = phase() === "green";
        var alpha = supportDimTimer > 0 ? 0.38 : 1;

        c.save();
        c.globalAlpha = 0.65 * alpha;
        c.strokeStyle = "rgba(111,218,255,.60)";
        c.lineWidth = 1.6;
        c.shadowColor = "#80dcff";
        c.shadowBlur = window.MBShouldReduceBossEffects && window.MBShouldReduceBossEffects() ? 0 : 12;
        c.beginPath();
        c.ellipse(sx, sy, 26 * pulse, 13 * pulse, Math.sin(now / 700) * 0.35, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;

        if (route && routeTimer > 0 && !isGreen) {
            var routeAlpha = Math.min(0.95, routeTimer / 42);
            c.globalAlpha = routeAlpha;
            c.strokeStyle = "#b7eeff";
            c.lineWidth = 2;
            c.setLineDash([4, 6]);
            c.beginPath();
            c.moveTo(route.fromX, route.fromY);
            c.lineTo(route.targetX, route.targetY);
            c.stroke();
            c.setLineDash([]);
            for (var ri = 1; ri <= 5; ri++) {
                var rt = ri / 6;
                drawStar(c, route.fromX + (route.targetX - route.fromX) * rt,
                    route.fromY + (route.targetY - route.fromY) * rt,
                    4 + Math.sin(now / 90 + ri) * 1.2, now / 500, "#c9f4ff");
            }
            c.strokeStyle = "#effcff";
            c.lineWidth = 2.3;
            c.beginPath();
            c.arc(route.targetX, route.targetY, 17 + Math.sin(now / 70) * 3, 0, Math.PI * 2);
            c.stroke();
            drawStar(c, route.targetX, route.targetY, 10, now / 300, "#f0fcff");
        }

        if (constellationFlash > 65 && typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            c.globalAlpha = Math.min(1, (constellationFlash - 65) / 20);
            c.strokeStyle = "#e8fbff";
            c.lineWidth = 4;
            c.shadowColor = "#a7eaff";
            c.shadowBlur = 16;
            c.beginPath();
            c.moveTo(sx, sy);
            c.lineTo(livingStoneBoss.x, livingStoneBoss.y);
            c.stroke();
            c.shadowBlur = 0;
        }

        if (blockStars > 0 && isGreen) {
            var starOffsets = [{ x: -15, y: -28 }, { x: 0, y: -36 }, { x: 15, y: -28 }];
            c.globalAlpha = 0.9;
            if (blockStars >= 3 || constellationFlash > 0) {
                c.strokeStyle = "#d9f7ff";
                c.lineWidth = 2;
                c.shadowColor = "#9eeaff";
                c.shadowBlur = constellationFlash > 0 ? 14 : 6;
                c.beginPath();
                c.moveTo(sx + starOffsets[0].x, sy + starOffsets[0].y);
                c.lineTo(sx + starOffsets[1].x, sy + starOffsets[1].y);
                c.lineTo(sx + starOffsets[2].x, sy + starOffsets[2].y);
                c.closePath();
                c.stroke();
                c.shadowBlur = 0;
            }
            for (var bi = 0; bi < blockStars; bi++) {
                drawStar(c, sx + starOffsets[bi].x, sy + starOffsets[bi].y,
                    constellationFlash > 0 ? 7 : 5, now / 420, "#e3faff");
            }
        }

        if (strikeFlash > 0 || routeHitFlash > 0) {
            c.globalAlpha = Math.min(1, Math.max(strikeFlash, routeHitFlash) / 22);
            c.strokeStyle = "#f1fcff";
            c.lineWidth = routeHitFlash > 0 ? 4 : 3;
            c.beginPath();
            c.moveTo(sx, sy);
            c.lineTo(livingStoneBoss.x || 200, livingStoneBoss.y || 110);
            c.stroke();
        }

        if (guardFlash > 0) {
            c.globalAlpha = Math.min(0.9, guardFlash / 30);
            c.strokeStyle = "#b9efff";
            c.lineWidth = 3;
            c.beginPath();
            c.arc(px, py, 26 + (64 - guardFlash) * 0.55, 0, Math.PI * 2);
            c.stroke();
        }

        if (finalLockTimer > 0 && typeof livingStoneBoss !== "undefined" && livingStoneBoss) {
            var bx = livingStoneBoss.x, by = livingStoneBoss.y;
            var lockAlpha = Math.min(1, finalLockTimer / 24);
            var lockPulse = 1 + Math.sin(now / 75) * 0.045;
            c.globalAlpha = lockAlpha;
            c.strokeStyle = "#d6f6ff";
            c.lineWidth = 2.4;
            c.shadowColor = "#84ddff";
            c.shadowBlur = 14;
            c.beginPath();
            c.arc(bx, by, 58 * lockPulse, 0, Math.PI * 2);
            c.stroke();
            c.beginPath();
            for (var ci = 0; ci < 8; ci++) {
                var ca = -Math.PI / 2 + ci * Math.PI / 4;
                var cx = bx + Math.cos(ca) * 58 * lockPulse;
                var cy = by + Math.sin(ca) * 58 * lockPulse;
                if (ci === 0) c.moveTo(cx, cy);
                else c.lineTo(cx, cy);
            }
            c.closePath();
            c.stroke();
            c.shadowBlur = 0;
            for (var si = 0; si < 8; si++) {
                var sa = now / 700 + si * Math.PI / 4;
                drawStar(c, bx + Math.cos(sa) * 58, by + Math.sin(sa) * 58, 6, sa, "#effcff");
            }
        }
        c.restore();

        drawAllyAttacks(c);
        window.MBDrawWaystarCompanion(sx, sy, 27);
        drawAllyStatus(c);
    }

    function stop() {
        active = false;
        supportRequested = false;
        frame = 0;
        guardFlash = 0;
        strikeFlash = 0;
        supportDimTimer = 0;
        attackPause = 0;
        strikeTimer = 95;
        guardCooldown = 0;
        route = null;
        routeTimer = 0;
        routeHitFlash = 0;
        blockStars = 0;
        constellationFlash = 0;
        finalLockTimer = 0;
        finalLockTriggered = false;
        finalDialogueStage = 0;
        lastPhase = "";
        allyAttacks.length = 0;
        allyParticles.length = 0;
        activeEncounterGeneration = -1;
    }

    window.MBWaystarAllyState = function () {
        return { alive: !!ally.alive, hp: ally.hp, maxHp: ally.maxHp, x: ally.x, y: ally.y };
    };
    window.MBHasWaystarCompanion = wasSpared;
    window.MBStartWaystarCompanionSupport = startSupport;
    window.MBUpdateWaystarCompanion = update;
    window.MBDrawWaystarCompanionSupport = draw;
    window.MBWaystarTryProtect = tryProtect;
    window.MBWaystarOnDodgePrediction = onDodgePrediction;
    window.MBWaystarTryRouteHit = tryRouteHit;
    window.MBWaystarOnGreenBlock = onGreenBlock;
    window.MBWaystarResetGreenBlocks = resetGreenBlocks;
    window.MBStopWaystarCompanion = stop;
})();