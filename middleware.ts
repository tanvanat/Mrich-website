/* 
ทุกครั้งที่เข้า /home, /form, /goal ถ้า ยังไม่ login
→ redirect ไป /signin ก่อนถึง page code
*/

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
});

export const config = {
  matcher: ["/home/:path*", "/form/:path*", "/goal/:path*"],
};
