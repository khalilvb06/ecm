import { useEffect } from "react";

type StaticRedirectProps = {
  to: string;
  replace?: boolean;
};

const StaticRedirect = ({ to, replace = true }: StaticRedirectProps) => {
  useEffect(() => {
    if (replace) {
      window.location.replace(to);
    } else {
      window.location.assign(to);
    }
  }, [to, replace]);

  return null;
};

export default StaticRedirect;


