import React, { Component } from 'react'
import '../App.css'

class Navbar extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      active: false
    }
  }
  toggleClass = () => {
    this.setState({
      active: !this.state.active
    })
  }

  render() {
    return (
      <div>
        <span className='bar'></span>
        <nav className='navbar'>
          <nav className='nav'>
            <a className={`${this.state.active ? "active" : null} nav-link`} href="localhost" 
            onClick={this.toggleClass}>Home</a>
            <a className={`${this.state.active ? "active" : null} nav-link`} href="localhost" 
            onClick={this.toggleClass}>About Us</a>
            <a className={`${this.state.active ? "active" : null} nav-link`} href="localhost" 
            onClick={this.toggleClass}>Contact</a>
            <a className={`${this.state.active ? "active" : null} nav-link`} href="localhost" 
            onClick={this.toggleClass}>FAQ</a>
          </nav>
          <form className='form'>
            <input className='search-bar' type="text" placeholder="I'm looking for..."/>
            <input className='search-btn' type="submit" value='Search'/>
          </form>
        </nav>
      </div>
    )
  }
}

export default Navbar
