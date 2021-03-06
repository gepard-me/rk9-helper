// OPCODE REQUIRED :
// - C_CHAT
// - S_ACTION_END
// - S_ACTION_STAGE
// - S_BOSS_GAGE_INFO
// - S_DUNGEON_EVENT_MESSAGE
// - S_LOAD_TOPO
// - S_LOGIN
// - S_QUEST_BALLOON
// - S_SPAWN_ME

// Version 1.3d r:00

const Command = require('command')

module.exports = function RK9Helper(d) {

    const command = Command(d)

    // general
    let cid,
        enable = false,
        prevZone = null,
        curZone = null

    // guide
    let channelNum = 0,
        chatGuild = false,
        chatNotice = false,
        chatParty = false,
        curBoss = 0,
        guideEnable = true,
        messageA = '',
        messageB = 'O',
        previousMechFirst = true,
        temp = 'Self'

    let MSG_STRING = []

    // code
    d.hook('S_LOGIN', (e) => {
        ({ cid } = e)
        prevZone = null
    })

    d.hook('S_LOAD_TOPO', (e) => {
        prevZone = curZone,
        curZone = e.zone
    })

    d.hook('S_SPAWN_ME', (e) => {
        if (!enable) return
        if (!(RK9_ZONE.includes(curZone))) return
        if (prevZone != SAVAGE_REACH) return
        if (curZone == prevZone) return
        e.x = RK9_LOBBY[0],
        e.y = RK9_LOBBY[1],
        e.z = RK9_LOBBY[2]
        return true
    })

    // RK-9 Kennel (hard) last boss guide code
    d.hook('S_BOSS_GAGE_INFO', (e) => {
        if (!enable) return
        if (!(RK9_ZONE.includes(curZone))) return
        curBoss = e.templateId
    })

    d.hook('S_ACTION_STAGE', (e) => {
        if (!guideEnable) return
        if (curBoss != RK9_THIRD_BOSS) return
        if (e.skill === 1202128153) {
            setTimeout(mechOrder, 500)
        }
    })

    d.hook('S_ACTION_END', (e) => {
        if (!guideEnable) return
        if (curBoss != RK9_THIRD_BOSS) return
        switch (e.skill) {
            case 1202128160:
            case 1202128161:
            case 1202128162:
                messageA = messageB,
                messageB = 'O'
                break
            default:
                return
        }
        setTimeout(() => {
            if (channelNum != 0) { sendChat(`Next : ` + messageA) }
            else { send(`Next : ` + messageA) }
        }, 8000)
    })

    // initial message hook
    d.hook('S_DUNGEON_EVENT_MESSAGE', (e) => {
        if (!guideEnable) return
        if (curBoss != RK9_THIRD_BOSS) return
        let messageId = parseInt(e.message.replace('@dungeon:', ''))
        switch (messageId) {
            case 9935302:
                messageA = MSG_STRING[0]
                break
            case 9935303:
                messageA = MSG_STRING[1]
                break
            case 9935304:
                messageA = MSG_STRING[2]
                break
            case 9935311:
                previousMechFirst = true
                break
            case 9935312:
                previousMechFirst = false
                break
            default:
                return
        }
        setTimeout(mechOrder, 2000)
    })

    d.hook('S_QUEST_BALLOON', (e) => {
        if (!guideEnable) return
        if (curBoss != RK9_THIRD_BOSS) return
        let balloonId = parseInt(e.message.replace('@monsterBehavior:', ''))
        switch (balloonId) {
            case 935301:
                messageB = MSG_STRING[0]
                break
            case 935302:
                messageB = MSG_STRING[1]
                break
            case 935303:
                messageB = MSG_STRING[2]
                break
        }
    })

    // helper
    function mechOrder() {
        if (previousMechFirst) {
            if (channelNum != 0) { sendChat(messageA + ` -> ` + messageB) }
            else { send(messageA + ` -> ` + messageB) }
        } else {
            if (channelNum != 0) { sendChat(messageB + ` -> ` + messageA) }
            else { send(messageB + ` -> ` + messageA) }
        }
    }

    function sendChat(msg) {
        d.toServer('C_CHAT', {
            channel: channelNum, // 1 = party, 2 = guild, 21 = party notice
            message: msg
        })
    }

    function setMessage() {
        if (d.base.protocolVersion.toString() == 323767) {
            send(`<font color="#56B4E9">KR support detected</font>`)
            MSG_STRING = ['근', '원', '터']
        } else {
            send(`<font color="#56B4E9">NA support detected</font>`)
            MSG_STRING = ['get OUT', 'get IN', 'WAVE']
        }
    }

    // command
    try {
        command.add('rk', (p1, p2) => {
            if (p1 === undefined) {
                enable = !enable
                send(`RK-9 Hangar module ${enable ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                if (enable) setMessage()
                send(`Status :
                    <br> - Guide : ${guideEnable}
                    <br> - Message to : ${temp}`)
                return
            }
            if (p1 == 'status') {
                send(`Status : ${enable ? 'On' : 'Off'}
                    <br> - Guide : ${guideEnable}
                    <br> - Message to : ${temp}`)
                return
            }
            if (!enable) {
                send(`<font color="#FF0000">Offline.</font>`)
                return
            }
            if (p1 == 'guide') {
                guideEnable = !guideEnable
                send(`Guide ${guideEnable ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                return
            }
            if (p1 == 'guild') {
                if (!guideEnable) {
                    send(`<font color="#FF0000">Guide is disabled.</font>`)
                    return
                }
                chatGuild = !chatGuild
                chatGuild ? (channelNum = 2, chatNotice = false, chatParty = false, temp = 'Guild') : (channelNum = 0, temp = 'Self')
                send(`Message to guild chat ${chatGuild ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                return
            }
            if (p1 == 'notice') {
                if (!guideEnable) {
                    send(`<font color="#FF0000">Guide is disabled.</font>`)
                    return
                }
                chatNotice = !chatNotice
                chatNotice ? (channelNum = 21, chatGuild = false, chatParty = false, temp = 'Notice') : (channelNum = 0, temp = 'Self')
                send(`Message to notice chat ${chatNotice ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                return
            }
            if (p1 == 'party') {
                if (!guideEnable) {
                    send(`<font color="#FF0000">Guide is disabled.</font>`)
                    return
                }
                chatParty = !chatParty
                chatParty ? (channelNum = 1, chatGuild = false, chatNotice = false, temp = 'Party') : (channelNum = 0, temp = 'Self')
                send(`Message to party chat ${chatParty ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
                return
            }
            if (p1 == 'test') {
                send(`Test :
                    <br> - ${MSG_STRING[0]}
                    <br> - ${MSG_STRING[1]}
                    <br> - ${MSG_STRING[2]}`)
                return
            }
            if (!(RK9_ZONE.includes(curZone))) {
                send(`<font color="#FF0000">Invalid zone.</font>`)
                return
            } else {
                send(`<font color="#FF0000">Invalid argument.</font>`)
            }
        })
        function send(msg) { command.message(`[rk9-helper] : ` + msg) }
    } catch (e) { console.log(`[ERROR] -- rk9-helper module --`) }

}

// constants
const RK9_DEVICE_LOCATION = {
    1: [-44591.781, 49384.055, 0.25],
    2: [-44584, 48114.629, 0.25],
    3: [-43328.5, 48118.527, 0.25],
    4: [-43328, 49370.785, 0.25]
}
const RK9_BOSS_LOCATION = {
    1: [-38366, 54391, 0.25],
    2: [-32878.3632, 58849.367, 0.25],
    3: [-33766, 40637, 22.25]
}
const RK9_LOBBY = [-41429.887, 40626.555, -950.874]
const RK9_ZONE = [9735, 9935]
const SAVAGE_REACH = 7031

const RK9_THIRD_BOSS = 3000

const START = 1202128153 // 패턴 시작
const FIRST_IN = 1202128156 // first_근
const FIRST_OUT = 1202128157 // first_원
const FIRST_SPD = 1202128158 // first_전
const SECOND_IN = 1202128160 // second_근
const SECOND_OUT = 1202128161 // second_원
const SECOND_SPD = 1202128162 // second_전
const QUEST_IN = 935301 // 근
const QUEST_OUT = 935302 // 전
const QUEST_SPD = 935303 // 원
