# Appendix C. Writing ChartDown

These cases check the canonical text a writer makes of a chart's JSON form.
The `canonical` block is the exact text, every line ending with a line feed.
When the chart has no warnings, the runner also reads the text back and
checks it gives the same chart, and that writing it again changes nothing.

### C The header, a blank line, then each section with a blank line before it; every line ends with a line feed

```chartdown
## Verse
1 | 4
## Chorus
5 | 1
```

```canonical
---
chartdown: 0.10
---

## Verse
1 | 4

## Chorus
5 | 1
```

### C.1 The header is written even when the chart has none, with the writer's version

```chartdown
## A
x
```

```canonical
---
chartdown: 0.10
---

## A
x
```

### C.1 Header fields: chartdown first, then the names of 3 in their order, then other names in their order

```chartdown
---
feel: Slow shuffle
Key: G
title: Open Road
chartdown: 0.9
capo: 2
tempo: 76
---
## A
1
```

```canonical
---
chartdown: 0.10
title: Open Road
key: G
tempo: 76
feel: Slow shuffle
capo: 2
---

## A
1
```

### C.2 Notes follow the section name in order; roles by their JSON name, separated by a comma and a space

```chartdown
---
instruments: cello
---
## Chorus
4 | 1
> Watch the stops.
> MD: Big.
> MD Bass & Keys: Roots only.
> MD gtr: Clean.
> MD cello: Long notes.
```

```canonical
---
chartdown: 0.10
instruments: cello
---

## Chorus
> Watch the stops.
> MD: Big.
> MD bass, keys: Roots only.
> MD guitar: Clean.
> MD cello: Long notes.
4 | 1
```

### C.2 A section with use is written as @use, with its count, and none of its rows

```chartdown
## Chorus
4 | 1
## Chorus 2
> MD 1x, 3x: Quiet.
> MD 2x drums: Crash on the way back.
@use Chorus 3x
## Chorus 3
@use chorus
```

```canonical
---
chartdown: 0.10
---

## Chorus
4 | 1

## Chorus 2
> MD 1x,3x: Quiet.
> MD 2x drums: Crash on the way back.
@use Chorus 3x

## Chorus 3
@use chorus
```

### C.3 A key, meter or tempo change is written before its row, @key then @meter then @tempo

```chartdown
---
key: G
meter: 4/4
tempo: 76
---
## Verse
1 | 4
@KEY Bb
@tempo 80
1 | 4
## Bridge
@meter 6/8
@key Gm
1m | b6
```

```canonical
---
chartdown: 0.10
key: G
tempo: 76
meter: 4/4
---

## Verse
1 | 4
@key Bb
@tempo 80
1 | 4

## Bridge
@key Gm
@meter 6/8
1m | b6
```

### C.3 A tempo unit is written only when it isn't the beat of the meter, and ? when it isn't known

```chartdown
---
meter: 6/8
tempo: 58
---
## A
1 | 4
@tempo 87 q
1 | 4
@meter 4/4
5 | 1
@tempo 90
5 | 1
@tempo 60 ?
1
```

```canonical
---
chartdown: 0.10
tempo: 58
meter: 6/8
---

## A
1 | 4
@tempo 87 q
1 | 4
@meter 4/4
5 | 1
@tempo 90
5 | 1
@tempo 60 ?
1
```

### C.3 A tempo that only repeats what is in effect is not written

```chartdown
---
tempo: 72 q
---
## A
1
@tempo 72
4
## B
@tempo 72.50
5
```

```canonical
---
chartdown: 0.10
tempo: 72 q
---

## A
1
4

## B
@tempo 72.5
5
```

### C.3 The copied rows of @use don't change the meter or tempo in effect

```chartdown
---
tempo: 80
---
## Verse
@meter 3/4
@tempo 96
1 | 4
## Bridge
@meter 4/4
@tempo 80
5 | 1
## Verse 2
@use Verse
## Outro
1
```

```canonical
---
chartdown: 0.10
tempo: 80
---

## Verse
@meter 3/4
@tempo 96
1 | 4

## Bridge
@meter 4/4
@tempo 80
5 | 1

## Verse 2
@use Verse

## Outro
1
```

### C.3 The key of a copy is written just before @use, after the notes

```chartdown
---
key: G
---
## Chorus
4 | 1
## Last chorus
@key A
> MD: Up a whole step.
@use Chorus
## Tag
5 | 1
```

```canonical
---
chartdown: 0.10
key: G
---

## Chorus
4 | 1

## Last chorus
> MD: Up a whole step.
@key A
@use Chorus

## Tag
5 | 1
```

### C.4 Bars are separated by " | "; repeat signs at the ends, with the count only when it isn't 2

```chartdown
## A
|: 1 | 4 :|x3
| 5 | 1 |
1|4|[1] 5 :| 2x
[2] 4 | 1
```

```canonical
---
chartdown: 0.10
---

## A
|: 1 | 4 :| 3x
5 | 1
1 | 4 | [1] 5 :|
[2] 4 | 1
```

### C.4 The parts of a bar in order: openings, start marks, dynamic, tempo mark, tokens, cues, lyric, end marks

```chartdown
## Intro
[p:2] 5 | [m:2/4] 4 | 1
## Verse
|: "Take the open road" {drums: in} 1 4 {mf} {Segno} {rit} {watch me} {2x bass, keys: walk} | [1-2] {to coda} 5 :| 3x
[3] 5 {D.S. AL CODA}
## Coda
{Coda} 1 {fine}
```

```canonical
---
chartdown: 0.10
---

## Intro
[p:2] 5 | [m:2/4] 4 | 1

## Verse
|: {segno} {mf} {rit} 1 4 {drums: in} {watch me} {2x bass, keys: walk} "Take the open road" | [1,2] 5 {to coda} :| 3x
[3] 5 {D.S. al coda}

## Coda
{coda} 1 {fine}
```

### C.4 Reserved words take one spelling

```chartdown
## A
{MF} {A Tempo} 1 {D.C.al Fine} | {FINE} 4
```

```canonical
---
chartdown: 0.10
---

## A
{mf} {a tempo} 1 {D.C. al fine} | 4 {fine}
```

### C.4 Navigation marks keep their order in nav

```chartdown
## A
{segno} 1 | 5 {D.S. al Coda} {to coda}
## B
{coda} 1
```

```canonical
---
chartdown: 0.10
---

## A
{segno} 1 | 5 {D.S. al coda} {to coda}

## B
{coda} 1
```

### C.5 Chords and marks in their order, qualities in their canonical form

```chartdown
## A
'4:2! 5:2 | ''<1>~ | 6-7 Bbmaj7/D | 4M7 2ø | % | = | x
```

```canonical
---
chartdown: 0.10
---

## A
'4! 5 | ''<1>~ | 6m7 Bbmaj7/D | 4maj7 2m7b5 | % | = | x
```

### C.5 The biggest group of equal shares is left out, and the other beats are written

```chartdown
## A
1:3 4:1 | 1! x:3 | 1:2 4 5 6 | 1:1 4:1 5:1 6:1 | 1:1 4:1 5 6 7
```

```canonical
---
chartdown: 0.10
---

## A
1 4:1 | 1! x:3 | 1:2 4 5 6 | 1 4 5 6 | 1:1 4:1 5 6 7
```

### C.5 On a tie, the group whose share needs more than 3 decimal places is left out

```chartdown
## A
1:0.5 4:0.5 5:0.5 6 7 x | 6 7 x 1:0.5 4:0.5 5:0.5
```

```canonical
---
chartdown: 0.10
---

## A
1:0.5 4:0.5 5:0.5 6 7 x | 6 7 x 1:0.5 4:0.5 5:0.5
```

### C.5 On a tie that is still even, the group of the earliest item is left out

```chartdown
## A
1:1 4:1 5:1 6:1 | 1:1.5 4:0.5 5:1.5 6:0.5
```

```canonical
---
chartdown: 0.10
---

## A
1 4 5 6 | 1 4:0.5 5 6:0.5
```

### C.5 A riff's notes follow the same rule inside the riff's beats

```chartdown
## A
x:2 R[ 1 3 x 5:1 ]:2 | R[ 1:2 3:2 ]
```

```canonical
---
chartdown: 0.10
---

## A
x R[ 1 3 x 5:1 ] | R[ 1 3 ]
```

### C.5 When the beats don't add up to the bar, every one is written

```chartdown
## A
1:3 4:3 | 1:3 4:2 5
```

```canonical
---
chartdown: 0.10
---

## A
1:3 4:3 | 1:3 4:2 5:0
```
