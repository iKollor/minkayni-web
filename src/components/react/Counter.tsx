/* Counter — reactbits.dev/components/counter (variante TS + Tailwind), con
   una sola adaptación: además del punto decimal, `places` admite cualquier
   cadena como separador literal. El sitio muestra «1.200» en español y
   «1,200» en inglés, y el original solo sabía pintar «1200». */
import { MotionValue, motion, useSpring, useTransform, type SpringOptions } from 'motion/react';
import type React from 'react';
import { useEffect } from 'react';

type PlaceValue = number | string;

interface NumberProps {
  mv: MotionValue<number>;
  number: number;
  height: number;
}

function Number({ mv, number, height }: NumberProps) {
  const y = useTransform(mv, latest => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) {
      memo -= 10 * height;
    }
    return memo;
  });

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return <motion.span style={{ ...baseStyle, y }}>{number}</motion.span>;
}

function normalizeNearInteger(num: number): number {
  const nearest = Math.round(num);
  const tolerance = 1e-9 * Math.max(1, Math.abs(num));
  return Math.abs(num - nearest) < tolerance ? nearest : num;
}

function getValueRoundedToPlace(value: number, place: number): number {
  const scaled = value / place;
  return Math.floor(normalizeNearInteger(scaled));
}

interface DigitProps {
  place: PlaceValue;
  value: number;
  height: number;
  digitStyle?: React.CSSProperties;
  spring?: SpringOptions;
}

function Digit({ place, value, height, digitStyle, spring }: DigitProps) {
  // Separador literal: el punto decimal del original o el de miles del sitio.
  if (typeof place === 'string') {
    return (
      <span
        className="relative inline-flex items-center justify-center"
        style={{ height, width: 'fit-content', ...digitStyle }}
      >
        {place}
      </span>
    );
  }

  const valueRoundedToPlace = getValueRoundedToPlace(value, place);
  const animatedValue = useSpring(valueRoundedToPlace, spring);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  const defaultStyle: React.CSSProperties = {
    height,
    position: 'relative',
    width: '1ch',
    alignItems: 'center',
    fontVariantNumeric: 'tabular-nums'
  };

  /* Adaptación: los dígitos van en absoluto, así que la caja no tendría línea
     base propia y, dentro de un párrafo, quedaría desalineada del texto. Un
     «0» invisible en flujo, en la misma caja y con el mismo centrado, le da
     la línea base exacta del glifo que se ve. */
  return (
    <span className="relative inline-flex clip-reveal" style={{ ...defaultStyle, ...digitStyle }}>
      <span aria-hidden="true" style={{ visibility: 'hidden' }}>
        0
      </span>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </span>
  );
}

export interface CounterProps {
  value: number;
  fontSize?: number;
  padding?: number;
  /**
   * Posiciones a pintar. Un número es una potencia de diez (100, 10, 1); una
   * cadena se pinta tal cual como separador. Vacío → se deduce de `value`.
   */
  places?: PlaceValue[];
  gap?: number;
  borderRadius?: number;
  horizontalPadding?: number;
  textColor?: string;
  fontWeight?: React.CSSProperties['fontWeight'];
  containerStyle?: React.CSSProperties;
  counterStyle?: React.CSSProperties;
  digitStyle?: React.CSSProperties;
  /** Resorte del conteo (motion `useSpring`); vacío → el de motion por defecto. */
  spring?: SpringOptions;
  gradientHeight?: number;
  gradientFrom?: string;
  gradientTo?: string;
  topGradientStyle?: React.CSSProperties;
  bottomGradientStyle?: React.CSSProperties;
}

export default function Counter({
  value,
  fontSize = 100,
  padding = 0,
  places = [...value.toString()].map((ch, i, a) => {
    if (ch === '.') {
      return '.';
    }

    const dotIndex = a.indexOf('.');
    const isInteger = dotIndex === -1;

    const exponent = isInteger ? a.length - i - 1 : i < dotIndex ? dotIndex - i - 1 : -(i - dotIndex);

    return 10 ** exponent;
  }),
  gap = 8,
  borderRadius = 4,
  horizontalPadding = 8,
  textColor = 'inherit',
  fontWeight = 'inherit',
  containerStyle,
  counterStyle,
  digitStyle,
  spring,
  gradientHeight = 16,
  gradientFrom = 'black',
  gradientTo = 'transparent',
  topGradientStyle,
  bottomGradientStyle
}: CounterProps) {
  const height = fontSize + padding;

  const defaultContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block'
  };

  const defaultCounterStyle: React.CSSProperties = {
    fontSize,
    display: 'flex',
    gap,
    /* Recorte solo vertical, como .clip-reveal de global.css: con overflow
       oculto, la tinta que sobresale del avance del último dígito se perdía. */
    clipPath: 'inset(0 -100vw)',
    borderRadius,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    lineHeight: 1,
    color: textColor,
    fontWeight,
    direction: 'ltr'
  };

  const gradientContainerStyle: React.CSSProperties = {
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const defaultTopGradientStyle: React.CSSProperties = {
    height: gradientHeight,
    background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`
  };

  const defaultBottomGradientStyle: React.CSSProperties = {
    height: gradientHeight,
    background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`
  };

  return (
    <span style={{ ...defaultContainerStyle, ...containerStyle }}>
      <span style={{ ...defaultCounterStyle, ...counterStyle }}>
        {places.map((place, index) => (
          <Digit key={`${place}-${index}`} place={place} value={value} height={height} digitStyle={digitStyle} spring={spring} />
        ))}
      </span>
      {gradientHeight > 0 && (
        <span style={gradientContainerStyle}>
          <span style={topGradientStyle ?? defaultTopGradientStyle} />
          <span style={bottomGradientStyle ?? defaultBottomGradientStyle} />
        </span>
      )}
    </span>
  );
}
