import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";

export let scanning = false;
export let writing = false;

NfcManager.start();

export interface TagData {}
export interface UserTagData extends TagData {
    uid: string
}

export enum TagType {
    UserCard="user",
    PowerupCard="powerup"
}

export interface TagObject {
    type: TagType,
    data: TagData
}

export async function readNdef(): Promise<TagObject | undefined> {
    if (scanning || writing) return;
    scanning = true;
    let requestAttmepted = false;
    let json = {}
    try {
        console.log("STARTING NDEF")
        requestAttmepted = true;
        await NfcManager.requestTechnology(NfcTech.Ndef)
            .then(async()=>{
                console.log("NDEF Tag Found!")
                const tag = await NfcManager.getTag();
                const raw = Ndef.util.bytesToString(tag?.ndefMessage![0]!.payload!);
                json = JSON.parse(raw);
            });
    } catch (error) {
        console.log(error)
    } finally {
        try {
            if (requestAttmepted) {
                await NfcManager.cancelTechnologyRequest();
            }
        } catch (cleanupError) {
            console.log("nfc cleanup failed!")
        } finally {
            scanning = false;
            return json as TagObject
        }
    }
}

export async function writeNdef(data: TagObject) {
    if (scanning) {await NfcManager.cancelTechnologyRequest(); scanning = false;}
    let requestAttempted = false;
    try {
        requestAttempted = true;
        await NfcManager.requestTechnology(NfcTech.Ndef);

        const bytes = Ndef.encodeMessage([
            Ndef.record(1, "text/plain", "", JSON.stringify(data))
        ])

        NfcManager.ndefHandler.writeNdefMessage(bytes);
    } catch (error) {
        console.log(error)
    } finally {
        if (requestAttempted) {
            await NfcManager.cancelTechnologyRequest()
        }

        writing = false;
    }
}