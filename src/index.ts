export type InputElementData = {
    value: string;
    caretPos?: number;
}
type CaretOptions = {
    add?: number;
    multiplier?: number;
    ignore?: boolean;
}
export type BaseNumber = 2 | 3 | 4 | 6 | 8 | 10 | 12 | 16 | 20 | 32 | 36 | 45 | 58 | 64;

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const NUMS = '0123456789';
const BASE_CHARACTERS = LETTERS + NUMS;

function _applyRegex(
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

class SmartRegex {
    protected _pattern!: RegExp;
    protected _patternNotGlobal!: RegExp;

    constructor(pattern: RegExp) {
        this._pattern = pattern;
        this._patternNotGlobal = new RegExp(this._pattern, this._pattern.flags.replace('g', ''));
    }

    get pattern() {
        return this._pattern;
    }
    test(string: string) {
        return this._patternNotGlobal.test(string);
    }
    match(string: string) {
        return string.match(this._pattern);
    }
}
class _ApplicableSmartRegex extends SmartRegex {
    protected _replace?: string;
    protected _caretOptions?: CaretOptions;

    constructor(pattern: RegExp, replace?: string, caretOptions?: CaretOptions) {
        super(pattern);

        this._replace = replace;

        this._caretOptions = caretOptions;
    }
    protected _applyTo(string: string, caretPos?: number, pattern: RegExp = this._pattern) {
        return _applyRegex({ pattern, replace: this._replace }, { value: string, caretPos }, this._caretOptions)
    }
}
class RemovingInvalidSmartRegex extends _ApplicableSmartRegex {
    protected _patternInvalid!: RegExp;

    constructor(pattern: RegExp, replace?: string, caretOptions?: CaretOptions) {
        super(pattern, replace, caretOptions);

        this._patternInvalid = new RegExp(this._pattern.source.replace('^[', '^[^'), this._pattern.flags)
    }
    removeInvalid(string: string, caretPos?: number) {
        return this._applyTo(string, caretPos, this._patternInvalid);
    }
}
class RemovingSmartRegex extends _ApplicableSmartRegex {
    constructor(pattern: RegExp, replace?: string, caretOptions?: CaretOptions) {
        super(pattern, replace, caretOptions);
    }
    remove(string: string, caretPos?: number) {
        return this._applyTo(string, caretPos);
    }
}
class ApplicableSmartRegex extends _ApplicableSmartRegex {
    constructor(pattern: RegExp, replace?: string, caretOptions?: CaretOptions) {
        super(pattern, replace, caretOptions);
    }
    applyTo(string: string, caretPos?: number) {
        return this._applyTo(string, caretPos);
    }
}

export default {
    string: {
        base: function (n: BaseNumber = 16): RemovingInvalidSmartRegex {
            if (n < 32 || n == 36) {
                let pattern = new RegExp(`^[${BASE_CHARACTERS.slice(0, n - 1)}]+$`, 'gim');
                return new RemovingInvalidSmartRegex(pattern);
            }
            if (n == 32) {
                let pattern = new RegExp(`^[${BASE_CHARACTERS.replace(/[0189]/g, '')}]+$`, 'gim');
                return new RemovingInvalidSmartRegex(pattern);
            }
            if (n == 45) {
                let pattern = new RegExp(`^[${BASE_CHARACTERS} \\$%\\*\\+\\-\\.\\/:]+$`, 'gim');
                return new RemovingInvalidSmartRegex(pattern);
            }
            if (n == 58) {
                let pattern = new RegExp(`^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$`, 'gm');
                return new RemovingInvalidSmartRegex(pattern);
            }
            let pattern = new RegExp(`^[${BASE_CHARACTERS}\\+\\/]+$`, 'gim');
            return new RemovingInvalidSmartRegex(pattern);
        },
        date: new SmartRegex(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d\d\dZ)/), //2022-08-26T20:52:42.905Z
    },
    number: {
        anyMinus: new RemovingSmartRegex(/-/g),
        minusInsideNumber: new RemovingSmartRegex(/(.+)-/g, '$1'),
        leadingZeros: new RemovingSmartRegex(/^(-?)0+([^.,])/, '$1$2'),
        isValidNumber: new SmartRegex(/^-?\d+([.,]\d+)?$/),
        hasInvalidChars: new RemovingSmartRegex(/[^0-9,\.\-]/g),
        commaToDot: new ApplicableSmartRegex(/,/g, '.', { ignore: true }),
        dotToComma: new ApplicableSmartRegex(/\./g, ',', { ignore: true }),
        multipleDecimalSeparators: new RemovingSmartRegex(/(\..*)\./g, '$1'),
        fixLeadingDecimalPoint: new ApplicableSmartRegex(/^(-?)([.,]\d)/, '$10$2'),
    },
    hex: {
        multipleHashSigns: new RemovingSmartRegex(/#(.*)#/g, '#$1'),
        hasInvalidChars: new RemovingSmartRegex(/[^#0-9a-f]/gi),
    }
}