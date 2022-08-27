export type InputElementData = {
    value: string;
    caretPos?: number;
}
export type CaretOptions = {
    add?: number;
    multiplier?: number;
    ignore?: boolean;
}
export function smartReplace(
    pattern: { pattern: RegExp; replace?: string },
    input: InputElementData,
    caretOptions ?: CaretOptions
): InputElementData {
    let match = input.value.match(pattern.pattern) ?? [];
    if (match) {
        if (input.caretPos && !caretOptions?.ignore) {
            let caretChange = match.length * (caretOptions?.multiplier ?? 1) + (caretOptions?.add ?? 0);
            input.caretPos -= caretChange;
        }
        input.value = input.value.replace(pattern.pattern, pattern.replace ?? '');
    }
    return input;
}