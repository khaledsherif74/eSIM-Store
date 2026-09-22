import { useNavigate } from "react-router-dom";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth.jsx";
import "./Navbar.css";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-mark">e</span>
          <span className="navbar-title">eSIM Store</span>
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
