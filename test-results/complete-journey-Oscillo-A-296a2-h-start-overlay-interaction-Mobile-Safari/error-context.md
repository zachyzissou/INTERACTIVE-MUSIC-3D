# Page snapshot

```yaml
- text: Key
- combobox "Musical key":
  - option "C" [selected]
  - option "G"
  - option "D"
  - option "A"
  - option "E"
  - option "B"
  - option "F#"
  - option "Db"
  - option "Ab"
  - option "Eb"
  - option "Bb"
  - option "F"
- text: Scale
- combobox "Musical scale":
  - option "Major" [selected]
  - option "Minor"
- text: Volume
- slider "Audio volume": "0.8"
- text: Synth Preset
- combobox "Synthesizer preset":
  - option "Lead" [selected]
  - option "Pad"
  - option "Bass"
  - option "Pluck"
- link "Skip to main content":
  - /url: "#main-content"
- heading "Load Example Scene" [level=2]
- button "Ambient Pad"
- button "Techno Loop"
- button "Jazz Combo"
- button "Open performance settings": "Perf: medium"
- button "Open accessibility settings"
- alert
```