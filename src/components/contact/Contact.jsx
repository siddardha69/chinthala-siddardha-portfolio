import { useRef, useState } from 'react';
import './contact.css';
import { MdOutlineEmail } from 'react-icons/md';
import { FaLinkedin } from 'react-icons/fa';

import emailjs from '@emailjs/browser';

const Contact = () => {
  const form = useRef();
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [messageSubmitted, setMessageSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const sendEmail = (e) => {
    e.preventDefault();
    setMessageSubmitting(true);
    setError(null);

    emailjs
      .sendForm(
        process.env.REACT_APP_SERVICE_ID,
        process.env.REACT_APP_TEMPLATE_ID,
        form.current,
        process.env.REACT_APP_PUBLIC_KEY
      )
      .then(
        (result) => {
          if (result.text === 'OK') {
            setMessageSubmitting(false);
            setMessageSubmitted(true);
            // Reset form after successful submission
            e.target.reset();
            // Reset success message after 5 seconds
            setTimeout(() => {
              setMessageSubmitted(false);
            }, 5000);
          }
        },
        (error) => {
          setMessageSubmitting(false);
          setError('Failed to send message. Please try again or contact me directly.');
          console.error('EmailJS Error:', error.text);
        }
      );
  };

  return (
    <section id='contact'>
      <h1 className='small-title'>Get in Touch</h1>
      <h2 className='medium-title'>Contact Me</h2>

      <div className='container contact__container'>
        <div className='contact__options contact__panel'>
          <article className='contact__option'>
            <MdOutlineEmail className='contact__option-icon' />
            <h3>Email</h3>
            <h4>chinthalasiddardha69@gmail.com</h4>
            <a href='mailto:chinthalasiddardha69@gmail.com'>
              Email me
            </a>
          </article>

          <article className='contact__option'>
            <FaLinkedin className='contact__option-icon' />
            <h3>LinkedIn</h3>
            <h4>Chinthala Siddardha</h4>
            <a href='https://linkedin.com/in/siddardha-chinthala-158a88350' target='_blank' rel='noreferrer'>
              Connect with me
            </a>
          </article>
        </div>

        <form
          ref={form}
          onSubmit={sendEmail}
          aria-describedby='contact-form-status'
          aria-busy={messageSubmitting}
          className='contact__panel contact__form'
        >
          <div className='contact__form-group'>
            <label htmlFor='contact-name'>Full Name</label>
            <input
              id='contact-name'
              type='text'
              name='from_name'
              placeholder='Your Full Name'
              autoComplete='name'
              required
            />
          </div>
          <div className='contact__form-group'>
            <label htmlFor='contact-email'>Email</label>
            <input
              id='contact-email'
              type='email'
              name='reply_to'
              placeholder='Your Email'
              autoComplete='email'
              required
            />
          </div>
          <div className='contact__form-group'>
            <label htmlFor='contact-message'>Message</label>
            <textarea
              id='contact-message'
              name='message'
              rows='7'
              placeholder='Your Message'
              autoComplete='off'
              required
            ></textarea>
          </div>
          {/* Hidden field for current date */}
          <input
            type='hidden'
            name='current_date'
            value={new Date().toLocaleString()}
          />

          {/* Error Message */}
          {error && (
            <div id='contact-form-status' role='alert' aria-live='assertive' className='error-message'> Error: {error}</div>
          )}

          {/* Success Message */}
          {messageSubmitted && !messageSubmitting && (
            <div id='contact-form-status' role='status' aria-live='polite' className='success-message'> Message sent successfully. I&apos;ll get back to you soon.</div>
          )}

          {/* Submit Button States */}
          {!messageSubmitting && (
            <button type='submit' className='btn btn-primary submitted-show'>
              Send Message
            </button>
          )}

          {messageSubmitting && (
            <button
              type='button'
              className='btn btn-primary submitting-btn-show'
              disabled
            >
              <div className='lds-ring'>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              Sending...
            </button>
          )}
        </form>
      </div>
    </section>
  );
};

export default Contact;

