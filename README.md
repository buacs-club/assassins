# BUA Lock-in Assassins
Like senior assassins but it happens during BUA lock-in and uses an app on your phone!

## Get started

1. Install [Bun](https://bun.com/)
   
   If you are on MacOS and have Homebrew installed, you can just run
   ```bash
   brew install bun
   ```
   If you dont have Homebrew,
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
   If you are on Windows, I'm not helping you. If you are on Linux you can probably figure out how to install bun through whatever package manager you use.

2. Clone the repository and navigate to it (only instructions for if you have GitHub CLI, if you have GitHub desktop or another git client, figure it out)
   ```
   gh repo clone buacs-club/assassins-
   cd assassins-
   ```


2. Install dependencies
   ```bash
   bun install
   ```

3. Start the app: Follow the steps for each respective platform
   
   **iOS Cloud Build** (only needed if you are trying to build for ios on a Windows or Linux machine)
      1. Build the app using EAS
         ```bash
         bunx eas-cli@latest build --platform ios --profile unsigned
         ```

   **Android Run** (requires Nix package manager)
      1. Nix Develop & Run
         ```bash
         nix develop
         bunx expo run:android
         ```

   **IOS Run**
      1. Download XCode and ensure you have build tools and possibly an emulator for iOS (preferably 27.2 or later) installed.

      2. Run
         ```bash
         bunx expo run:ios --device
         ```
         1. If this fails, try opening the project in XCode with your device selected and running it from there. Then return to your terminal and re-run the command.

## Documentation
**NFC API**

The code for this is in [src/lib/ndef.ts](src/lib/ndef.ts). There are two functions, one for reading an NFC tag and another for writing.

`function readNdef()` Attempts to read an NFC tag until either it succeeds or is stopped.

`function writeNdef(data: TagObject)` Attempts to write the specified data to an NFC tag until either it succeeds or is stopped.

`interface TagObject` A format for the data stored on NFC tags, includes two properties, `type: TagType` and `data: TagData`. Type identifies the tag as either a player tag (a tag another player can tap to get a player out) or a powerup tag (a tag that when found and tapped gives a powerup to the player). The data property holds data related to the tag such as the user's ID or powerup type.

`enum TagType` The type of the tag, includes `UserTag` and `PowerupTag`.

---

**Database RPCs**

These are the Remote Procedure Calls available on the database. Any of these can be called using:
```typescript
supabase.rpc(name: string, args?: Object) -> Promise
```

- `attack_user(p_id uuid)` When supplied with a user id, checks if the user specified is the target of the signed in user and if so, takes them out of the game.
   ```typescript
   // This does not have to be run with await or .then() as it returns nothing
   supabase.rpc("attack_user", { p_id: uuid })
   ```

- `get_target_username` Returns the username of the currently signed in user's target.
   ```typescript
   // This specific example must be called in an async function, handle the Promise any way you want
   const username = await supabase.rpc("get_target_username");
   ```