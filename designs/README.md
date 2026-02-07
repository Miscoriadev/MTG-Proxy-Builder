# MTG Card Design Reference

## mtg_card_test.pen - Export Configurations

### Always Hide for Export

| Node ID | Name          | Purpose                            |
| ------- | ------------- | ---------------------------------- |
| `IlCJT` | Bleed Overlay | Black frame showing 5mm bleed area |

### Border Export

Hide all elements below:

| Node ID | Name            |
| ------- | --------------- |
| `eojXY` | Card Art        |
| `ru6wV` | Type Line       |
| `NuFnE` | Rules Text 1    |
| `cEEUm` | Rules Text 2    |
| `AEfIk` | Flavor Text     |
| `fBKua` | Paintbrush Icon |
| `hixfv` | artistName      |
| `CrqRG` | copyright       |
| `bYaN8` | Card Name       |
| `RxxNm` | Mana Cost       |
| `tvWDk` | PT Container    |

### Power Toughness Export

Hide all elements except:

| Node ID | Name         |
| ------- | ------------ |
| `tvWDk` | PT Container |

Also hide the PT Value text inside the PT Container:

| Node ID | Name     |
| ------- | -------- |
| `OR3h2` | PT Value |
