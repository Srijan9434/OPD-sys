import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-24 grid gap-10 border-t border-gray-300 py-10 text-sm text-gray-600 md:grid-cols-[3fr_1fr_1fr]">
      <div>
        <p className="mb-4 text-2xl font-semibold text-indigo-950">OPD Connect</p>
        <p className="max-w-md leading-6">
          Book appointments with trusted doctors online, skip the queue, and download your
          appointment slips and prescriptions anytime.
        </p>
      </div>
      <div>
        <p className="mb-4 text-base font-semibold uppercase text-gray-800">Company</p>
        <ul className="space-y-2">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About us</Link></li>
          <li><Link to="/contact">Contact us</Link></li>
          <li>Privacy policy</li>
        </ul>
      </div>
      <div>
        <p className="mb-4 text-base font-semibold uppercase text-gray-800">Get in touch</p>
        <ul className="space-y-2">
          <li>+91-00000-00000</li>
          <li>support@example.com</li>
        </ul>
      </div>
    </footer>
  )
}