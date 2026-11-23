/*
 * A link into another feature, which renders nothing — or its fallback — when that feature is
 * not part of this build. Features never import each other, so this is how one sends you to
 * another: by id, through the registry.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { featureHref } from '../shell/features';

export default function FeatureLink(
  props: Readonly<{
    feature: string;
    // Appended to the feature's path, e.g. '?filter=x'.
    suffix?: string;
    className?: string;
    onClick?: () => void;
    // What shows instead of the link when the feature is missing.
    fallback?: ReactNode;
    children: ReactNode;
  }>,
) {
  const to = featureHref(props.feature, props.suffix);
  if (to === null) {
    return <>{props.fallback}</>;
  }
  return (
    <Link className={props.className} to={to} onClick={props.onClick}>
      {props.children}
    </Link>
  );
}
