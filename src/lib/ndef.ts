import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";

export let scanning = false;

NfcManager.start();

export async function readNdef() {
    if (scanning) return;
    scanning = true;
    let requestAttmepted = false;
    try {
        console.log("STARTING NDEF")
        requestAttmepted = true;
        await NfcManager.requestTechnology(NfcTech.Ndef)
            .then(()=>{
                console.log("technology requested")
            });
        const tag = await NfcManager.getTag();
        console.log(Ndef.util.bytesToString(tag?.ndefMessage![0]!.payload!));
    } catch (error) {
        console.log(error)
    } finally {
        try {
            if (requestAttmepted) {
                await NfcManager.cancelTechnologyRequest();
            }
        } catch (cleanupError) {
            console.log("NFC CLEANUP Failed")
        } finally {
            scanning = false;
        }
    }
}

export async function writeNdef() {
    await NfcManager.cancelTechnologyRequest()
    let requestAttempted = false;
    try {
        requestAttempted = true;
        await NfcManager.requestTechnology(NfcTech.Ndef);

        const bytes = Ndef.encodeMessage([
            Ndef.record(1, "text/plain", "", "Hello world")
        ])

        NfcManager.ndefHandler.writeNdefMessage(bytes);
    } catch (error) {
        console.log(error)
    } finally {
        if (requestAttempted) {
            await NfcManager.cancelTechnologyRequest()
        }
    }
}