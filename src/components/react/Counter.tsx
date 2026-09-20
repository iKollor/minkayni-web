/* Counter — reactbits.dev/components/counter (variante TS + Tailwind),
   adaptado al sitio en tres cosas:

   - `places` admite cualquier cadena como separador literal: «1.200» en
     español, «1,200» en inglés. El original solo sabía pintar «1200».

   - Cada columna mide lo que mide su dígito final en la tipografía real, no
     `1ch` fijo. El original mete todos los dígitos en cajas iguales al ancho
     del «0»; en Aristotelica el «1» mide la mitad que el «0», así que «12»
     salía un 70 % más ancho que escrito a mano y con huecos entre cifras que
     la fuente no tiene. Un dígito en flujo (invisible) da a la columna su
     ancho, su altura y su línea base; los diez dígitos que ruedan van en
     absoluto encima, centrados en ese ancho.

   - La altura de la columna es el interlineado del texto que la rodea
     (`lineHeight`), no el cuerpo de la fuente: el original fija `height =
     fontSize` y centra el glifo con flex, y así la cifra engordaba la línea
     (66 px en una línea de 60) y se salía de la línea base. Con el mismo
     interlineado, la caja es idéntica a la de un carácter normal. */
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

  /* Sin flex ni centrado vertical: con el mismo interlineado que el dígito
     en flujo, el glifo cae exactamente donde caería en el texto. */
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    lineHeight: `${height}px`
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
      <span className="relative inline-block" style={{ lineHeight: `${height}px`, ...digitStyle }}>
        {place}
      </span>
    );
  }

  const valueRoundedToPlace = getValueRoundedToPlace(value, place);
  const animatedValue = useSpring(valueRoundedToPlace, spring);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  /* El dígito en el que acabará esta columna: es el que fija su ancho. */
  const finalDigit = ((valueRoundedToPlace % 10) + 10) % 10;

  /* inline-flex y no inline-block: un inline-block con overflow oculto pierde
     su línea base (pasa a ser el borde inferior); un contenedor flex la toma
     de su primer hijo en flujo, el dígito invisible. */
  const defaultStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    overflow: 'hidden',
    lineHeight: `${height}px`
  };

  return (
    <span style={{ ...defaultStyle, ...digitStyle }}>
      <span aria-hidden="true" style={{ visibility: 'hidden' }}>
        {finalDigit}
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
  /** Interlineado en px del texto que rodea al contador: la altura de cada
      columna. Sin él se usa el cuerpo (`fontSize + padding`), como el original. */
  lineHeight?: number;
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
  lineHeight,
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
  const height = lineHeight ?? fontSize + padding;

  const defaultContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block'
  };

  const defaultCounterStyle: React.CSSProperties = {
    fontSize,
    display: 'flex',
    alignItems: 'baseline',
    gap,
    overflow: 'hidden',
    borderRadius,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
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
