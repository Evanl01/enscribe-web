"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styled from "styled-components";
import Image from "next/image";
import * as api from "@/src/lib/api";

const AppHeader = styled.header`
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 100;
  left: 0;
  right: 0;
`;

const HeaderContainer = styled.div`
  //   max-width: 1200px;
  margin: 10px 0px;
  padding: 0px 20px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AppTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333333;
  margin-right: 2rem;
  flex-shrink: 0;
`;

const HeaderNav = styled.nav`
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
  gap: 2rem;
`;

const DesktopMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 767px) {
    display: none;
  }
`;

const HeaderUserMenu = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-left: 2rem;
  position: relative; /* anchor dropdown to this container */

  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  display: block;
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;

  @media (min-width: 768px) {
    display: none;
  }
`;

const NavItem = styled.div`
  position: relative;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #333333;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  letter-spacing: 0.01em;
`;

const DropdownIcon = styled.svg`
  margin-left: 0.25rem;
  width: 16px;
  height: 16px;
`;

const DropdownMenu = styled.div`
  position: absolute;
  left: 0;
  top: 100%;
  width: 12rem;
  background-color: #ffffff;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: none;
  z-index: 101;
  padding-top: 8px;

  ${NavItem}:hover & {
    display: block;
  }
`;

const DropdownItem = styled(Link)`
  display: block;
  padding: 0.5rem 1rem;
  color: #333333;
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    background-color: #f3f4f6;
  }

  &.active {
    background-color: #e5edff;
    color: #1e40af;
  }
`;

const UserMenuButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
`;

const UserDropdownIcon = styled.svg`
  margin-left: 0.25rem;
  width: 20px;
  height: 20px;
`;

const UserDropdownMenu = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  width: 8rem;
  background: #fff;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 102;
  min-width: 8rem;
  padding-top: 8px;
  display: none;

  /* show when parent header user menu is hovered (matches nav behavior) */
  ${HeaderUserMenu}:hover & {
    display: block;
  }
`;

const UserDropdownItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #333333;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const MobileMenu = styled.div`
  display: block;
  padding-bottom: 1rem;

  @media (min-width: 768px) {
    display: none;
  }
`;

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Sign-out helper: call client API to clear tokens (no redirect) then
  // navigate via Next router to preserve SPA navigation.
  const signOutAndRedirect = async () => {
    try {
      // close menus immediately for UI responsiveness
      setUserMenuOpen(false);
      setMenuOpen(false);
      // ask api helper to not perform its own redirect
      await api.handleSignOut();
    } catch (e) {
      // ignore errors here; still redirect to login
      // console.warn('signOut error', e);
    } finally {
      router.push('/login');
    }
  };

  const navigation = [
    {
      category: "Dashboard",
      path: "/dashboard", // direct link if no sub-items
      items: [],
    },
    {
      category: "Patient Encounters",
      items: [
        { name: "New Patient Encounter", path: "/new-patient-encounter" },
        { name: "View Patient Encounters", path: "/view-patient-encounters" },
      ],
    },
    {
      category: "Recordings",
      items: [
        { name: "View Recordings", path: "/view-recordings" },
      ],
    },
    {
      category: "Soap Notes",
      items: [
        // { name: "New Soap Note", path: "/new-soap-note" },
        { name: "View Soap Notes", path: "/view-soap-notes" },
      ],
    },
    {
      category: "Additional Tools",
      items: [
        // { name: "New Soap Note", path: "/new-soap-note" },
        { name: "Dot Phrases", path: "/dot-phrases" },
      ],
    },
  ];


  // Use public/default-avatar.png for the user avatar to allow swapping
  // with an image asset instead of inline SVG. Image is 32x32 and rounded.
  const DefaultUserAvatar = () => (
    <Image
      src="/default-avatar.png"
      alt="User avatar"
      width={32}
      height={32}
      style={{ borderRadius: "50%", objectFit: "cover" }}
      priority={false}
    />
  );

  return (
    <>
      <AppHeader>
        <HeaderContainer>
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <Image
              src="/emscribe-icon128.png"
              alt="EmScribe Logo"
              width={20}
              height={20}
              style={{ marginRight: "0.75rem" }}
            />
            <AppTitle style={{ margin: 0, color: "#333333" }}>
              EmScribe
            </AppTitle>
          </Link>
          <HeaderNav>
            <DesktopMenu>
              {navigation.map((nav) => (
                <NavItem key={nav.category}>
                  {nav.items && nav.items.length > 0 ? (
                    <NavButton>
                      {nav.category}
                      {nav.items && nav.items.length > 0 && (
                        <DropdownIcon viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </DropdownIcon>
                    )}
                  </NavButton>): ("")}
                  {nav.items && nav.items.length > 0 ? (
                    <DropdownMenu>
                      {nav.items.map((item) => (
                        <DropdownItem
                          key={item.path}
                          href={item.path}
                          className={pathname === item.path ? "active" : ""}
                        >
                          {item.name}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  ) : (
                    <DropdownItem
                      key={nav.path}
                      href={nav.path}
                      className={pathname === nav.path ? "active" : ""}
                    >
                      {nav.category}
                    </DropdownItem>
                  )}
                </NavItem>
              ))}
            </DesktopMenu>
            <HeaderUserMenu
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
              onFocus={() => setUserMenuOpen(true)}
              onBlur={() => setUserMenuOpen(false)}
              tabIndex={0}
            >
              <UserMenuButton>
                <DefaultUserAvatar />
                <UserDropdownIcon viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </UserDropdownIcon>
              </UserMenuButton>
              {userMenuOpen && (
                <UserDropdownMenu>
                  <UserDropdownItem onClick={signOutAndRedirect}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ marginRight: "0.5rem" }}
                    >
                      <path
                        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Sign Out
                  </UserDropdownItem>
                </UserDropdownMenu>
              )}
            </HeaderUserMenu>
            <MobileMenuButton onClick={() => setMenuOpen(!menuOpen)}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {menuOpen ? (
                  <path
                    d="M6 18L18 6M6 6L18 18"
                    stroke="#333333"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M4 6H20M4 12H20M4 18H20"
                    stroke="#333333"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </MobileMenuButton>
          </HeaderNav>
        </HeaderContainer>
        {menuOpen && (
          <MobileMenu>
            {navigation.map((nav) => (
              <div key={nav.category} className="mt-4">
                <h3 className="font-medium text-gray-500 px-2">
                  {nav.category}
                </h3>
                <div className="mt-1 space-y-1">
                  {nav.items.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        pathname === item.path
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={signOutAndRedirect}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ marginRight: "0.5rem" }}
                >
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </MobileMenu>
        )}
      </AppHeader>
    </>
  );
};

export default Header;
