import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = environment.useMockApi
    ? `/api${req.url}`
    : `https://api.realworld.show/api${req.url}`;

  const apiReq = req.clone({ url });
  return next(apiReq);
};
