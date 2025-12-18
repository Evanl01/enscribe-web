import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import styled from "styled-components"
import * as api from "@/lib/api"

const AppHeader = styled.header`
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 100;
  left: 0;
  right: 0;
`

const HeaderContainer = styled.div`
  margin: 10px 0px;
  padding: 0px 20px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const AppTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333333;
  margin-right: 2rem;
  flex-shrink: 0;
`

const HeaderNav = styled.nav`
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
  gap: 2rem;
`

const NavItem = styled.div`
  position: relative;
`

const DesktopMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 767px) {
    display: none;
  }
`

const HeaderUserMenu = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-left: 2rem;
  position: relative;

  @media (max-width: 767px) {
    display: none;
  }
`

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

  /* show when parent header user menu is hovered */
  ${HeaderUserMenu}:hover & {
    display: block;
  }
`

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
`

const MobileMenuButton = styled.button`
  display: block;
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;

  @media (min-width: 768px) {
    display: none;
  }
`

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
  text-decoration: none;

  &:hover {
    color: #1976d2;
  }
`

const UserMenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333333;

  &:hover {
    background: #eeeeee;
  }
`

const DropdownItem = styled.button`
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: #333333;
  font-size: 0.875rem;

  &:hover {
    background-color: #f3f4f6;
  }

  &:first-child {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  &:last-child {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Auth pages where we don't need to redirect on sign out
  const authRoutes = ['/login', '/signup', '/confirm-email']
  const isAuthPage = authRoutes.some(route => location.pathname.startsWith(route))

  // Sign-out helper: call client API to clear tokens (no redirect on auth pages)
  const signOutAndRedirect = async () => {
    try {
      // ask api helper to clear tokens
      await api.handleSignOut()
    } catch (e) {
      // ignore errors here; still redirect to login if not on auth page
      console.warn('signOut error', e)
    } finally {
      // Only redirect to login if we're on a protected page
      if (!isAuthPage) {
        navigate('/login')
      }
    }
  }

  const navigation = [
    {
      category: "Dashboard",
      path: "/dashboard",
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
      category: "SOAP Notes",
      items: [
        { name: "View SOAP Notes", path: "/view-soap-notes" },
        { name: "Edit SOAP Note", path: "/edit-soap-note" },
      ],
    },
    {
      category: "Dot Phrases",
      path: "/dot-phrases",
      items: [],
    },
  ]

  return (
    <AppHeader>
      <HeaderContainer>
        <div
          onClick={() => navigate('/')}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <img
            src="/emscribe-icon128.png"
            alt="EmScribe Logo"
            width={20}
            height={20}
            style={{ marginRight: "0.75rem" }}
          />
          <AppTitle style={{ margin: 0, color: "#333333" }}>
            EmScribe
          </AppTitle>
        </div>

        <HeaderNav>
          <DesktopMenu>
            {navigation.map((nav) => (
              <NavItem key={nav.category}>
                {nav.items.length === 0 ? (
                  <NavButton onClick={() => navigate(nav.path)}>
                    {nav.category}
                  </NavButton>
                ) : (
                  <>
                    <NavButton>{nav.category}</NavButton>
                    <DropdownMenu>
                      {nav.items.map((item) => (
                        <DropdownItem
                          key={item.path}
                          onClick={() => navigate(item.path)}
                        >
                          {item.name}
                        </DropdownItem>
                      ))}
                    </DropdownMenu>
                  </>
                )}
              </NavItem>
            ))}
          </DesktopMenu>

          <HeaderUserMenu>
            <UserMenuButton>
              User Menu ▼
            </UserMenuButton>
            <UserDropdownMenu>
              <DropdownItem onClick={() => navigate('/dashboard')}>
                Dashboard
              </DropdownItem>
              <DropdownItem onClick={() => navigate('/privacy-policy')}>
                Privacy Policy
              </DropdownItem>
              <DropdownItem onClick={signOutAndRedirect}>
                Sign Out
              </DropdownItem>
            </UserDropdownMenu>
          </HeaderUserMenu>
        </HeaderNav>
      </HeaderContainer>
    </AppHeader>
  )
}

export default Header
