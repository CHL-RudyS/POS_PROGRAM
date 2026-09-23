import { useState } from "react";
import logo from "../logo-chl.png";
import { COMPANY_VALUES, LANGS, LOGIN_ROLES, T, type Lang, type ScreenId } from "../data";
import { useStored } from "../store";
import { CaretDown } from "../components/icons";

export function Login({ onGo }: { onGo: (id: ScreenId) => void }) {
  const [lang, setLang] = useStored<Lang>("login.lang", "ID");
  const [langOpen, setLangOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useStored("login.role", LOGIN_ROLES[0]);
  const t = T[lang];

  return (
    <div className="login">
      <div className="login-left">
        <div className="login-left-inner">
          <div className="login-eyebrow">Internal System</div>
          <div className="login-brand">
            <img src={logo} alt="Logo PT. Cipta Harmoni Lestari" />
            <span>CIPTA HARMONI LESTARI</span>
          </div>
          <div className="login-values">
            <div className="login-values-title">Company Values</div>
            <div className="login-values-list">
              {COMPANY_VALUES.map(([letter, text]) => (
                <div key={letter + text} className="login-value">
                  <span className="login-value-letter">{letter}</span>
                  <span className="login-value-text">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="login-footer">
          <span>Integrated Hotel Management System</span>
          <span>Grand Nusantara Hotel &amp; Suites · Jakarta Pusat</span>
        </div>
      </div>

      <form className="login-card" onSubmit={(e) => { e.preventDefault(); onGo(role.to); }}>
        <div className="lang-picker">
          <button type="button" className="lang-toggle" onClick={() => setLangOpen(!langOpen)} aria-expanded={langOpen}>
            <span className={`flag flag-lg flag-${lang}`} />
            <span>{lang}</span>
            <CaretDown />
          </button>
          {langOpen && (
            <div className="lang-menu">
              {LANGS.map((o) => (
                <button type="button" key={o.code} className={"lang-opt" + (lang === o.code ? " is-active" : "")}
                  onClick={() => { setLang(o.code); setLangOpen(false); }}>
                  <span className={`flag flag-${o.code}`} />
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="login-card-brand">
          <img src={logo} alt="Logo CHL Group" />
          <span>CHL Group</span>
        </div>
        <p className="login-welcome">{t.welcome}</p>
        <div className="login-signin">{t.signin}</div>

        <div className="field login-field is-first">
          <label htmlFor="login-email">{t.email}</label>
          <input id="login-email" className="input" type="email" defaultValue="rina.pratiwi@kantor.id" autoComplete="username" />
        </div>
        <div className="field login-field">
          <label htmlFor="login-pass">{t.pass}</label>
          <input id="login-pass" className="input" type={showPass ? "text" : "password"} defaultValue="rahasia123"
            autoComplete="current-password" />
        </div>
        <label className="login-showpass">
          <input type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} />
          <span>{t.showPass}</span>
        </label>

        <div className="login-role-label">{t.role}</div>
        <div className="login-roles">
          {LOGIN_ROLES.map((r) => (
            <button type="button" key={r.role} className={"login-role" + (role.role === r.role ? " is-active" : "")}
              onClick={() => setRole(r)}>{r.role}</button>
          ))}
        </div>

        <button type="submit" className="btn btn-primary btn-block login-submit">{t.btn}</button>

        <div className="login-links">
          <a href="#" onClick={(e) => e.preventDefault()}>{t.forgot}</a>
          <span>{t.need}</span>
        </div>

        <div className="login-last">{t.lastOut} · 12 September 2026, 15:04 WIB</div>
      </form>
    </div>
  );
}
