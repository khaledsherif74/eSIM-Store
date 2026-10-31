import { useNavigate } from "react-router-dom";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useSiteInfo } from "../../hooks/useSiteInfo.jsx";
import "./Navbar.css";
import logo from "../../public/images/logo.png";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { siteName } = useSiteInfo();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" aria-label={siteName}>
          <img src={logo} className="navbar-mark" alt="" aria-hidden="true" />
          <span className="navbar-title" title={siteName}>
            {siteName}
          </span>
        </Link>
        <nav className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar-link${isActive ? " active" : ""}`
            }
          >
            {t("nav.home")}
          </NavLink>

          {!loading && user && (
            <>
              <NavLink
                to="/my-esims"
                className={({ isActive }) =>
                  `navbar-link${isActive ? " active" : ""}`
                }
              >
                {t("nav.my_esim")}
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `navbar-link${isActive ? " active" : ""}`
                }
              >
                {t("nav.profile")}
              </NavLink>
            </>
          )}

          <NavLink
            to="/help"
            className={({ isActive }) =>
              `navbar-link${isActive ? " active" : ""}`
            }
          >
            {t("nav.help")}
          </NavLink>

          {!loading &&
            (user ? (
              <button
                type="button"
                className="navbar-cta navbar-cta-secondary"
                onClick={handleLogout}
              >
                {t("nav.logout")}
              </button>
            ) : (
              <Link to="/auth?tab=signup" className="navbar-cta">
                {t("nav.join_us")}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
