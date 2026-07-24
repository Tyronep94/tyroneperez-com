type TemplateImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

/**
 * Editable template media deliberately uses a normal image element. The page
 * runtime can therefore switch replacements to intrinsic, in-flow geometry
 * without fighting Next.js Image `fill` positioning.
 */
export function TemplateImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: TemplateImageProps) {
  return <IntrinsicImage className={className} src={src} alt={alt} width={width} height={height} priority={priority} />;
}
import { IntrinsicImage } from "@/components/media/intrinsic-image";
