import {
  CodeBlock,
  CodeInline,
  dracula,
  Heading,
  Img,
  LinkProps,
  PrismLanguage,
  Tailwind,
  Text,
  TextProps,
  Link,
  Section,
  Head,
} from '@react-email/components'

type Author = {
  name: string;
  role: string;
  signatureName: string;
}

type SocialMedia = {
  url: string;
  _title: string;
  image?: {
    url: string;
  };
}

type RichTextContent = any;

type NewsletterEmailProps = {
  content: RichTextContent;
  blocks?: any;
  author?: Author | null;
  socialLinks?: SocialMedia[] | null;
  address?: string | null;
  unsubscribeLink?: string | null;
}

function NewsletterEmail({
  content,
  blocks,
  author,
  socialLinks,
  address,
  unsubscribeLink,
}: NewsletterEmailProps) {
  return (
    <Tailwind>
      <Head>
        <style>
          {`
          ul li p,
          ol li p {
             margin-bottom: 12px !important; 
            }

          blackquote p {
            margin-block: 12px !important; 
          }
         `}
        </style>
      </Head>
      <div className="max-w-screen-md mx-auto py-8 px-2 gap-8">
        {/* Content would be rendered here */}
        <div className="prose">
          <h2>Newsletter Content</h2>
          <p>This is a placeholder for the newsletter content.</p>
        </div>
        
        <Hr />
        <div>
          {author && (
            <>
              <div className="">
                {/* cursive font */}
                <p className='font-["Brush_Script_MT",_"Brush_Script_Std",_cursive] text-3xl text-[#1C2024] mb-0 mt-0'>
                  {author.signatureName}
                </p>
                <p className="eading-relaxed font-[Helvetica,_'ui-sans-serif'] text-base font-medium mt-0 !text-xs text-[#1C2024]">
                  {author.name}, {author.role}
                </p>
              </div>
              <Hr />
            </>
          )}
          {socialLinks && (
            <Section
              style={{
                textAlign: 'left',
                padding: 0,
                margin: 0,
                marginBottom: 16,
              }}
            >
              {socialLinks
                ?.filter((item) => item.image)
                .map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#F0F0F3',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      marginRight: 16,
                      textDecoration: 'none',
                      lineHeight: 0, // Critical for email clients
                    }}
                  >
                    {/* Centering container */}
                    <div
                      style={{
                        display: 'table',
                        width: '100%',
                        height: '100%',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'table-cell',
                          verticalAlign: 'middle',
                          padding: 0,
                          margin: 0,
                        }}
                      >
                        <Img
                          src={item.image?.url}
                          alt={item._title || 'Social icon'}
                          width={16}
                          height={16}
                          style={{
                            display: 'inline-block',
                            margin: '0 auto',
                            outline: 'none',
                            border: 'none',
                            lineHeight: 0,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
            </Section>
          )}
          {unsubscribeLink && (
            <p className="text-xs text-[#60646C] mb-4 eading-relaxed font-[Helvetica,_'ui-sans-serif'] mt-0">
              <A href={unsubscribeLink}>Unsubscribe</A> from these emails.
            </p>
          )}
          <pre className="text-sm font-[Helvetica,_'ui-sans-serif'] !text-[#B9BBC6] block">
            {address}
          </pre>
        </div>
      </div>
    </Tailwind>
  )
}

// Example data for preview
NewsletterEmail.PreviewProps = {
  content: [],
  author: {
    name: "John Doe",
    role: "Senior Developer",
    signatureName: "John"
  },
  socialLinks: [
    {
      url: "https://twitter.com/example",
      _title: "Twitter",
      image: {
        url: "/logo.svg"
      }
    }
  ],
  address: "123 Example Street, City, Country",
  unsubscribeLink: "/unsubscribe"
}

export default NewsletterEmail;

const Hr = () => (
  <hr className="border-t border-[#E9EAEE] my-8" />
)

const A = (props: LinkProps) => {
  return <Link {...props} className="text-[#0077CC] no-underline" />
}

const P = ({ children }: TextProps) => (
  <p className="text-base text-[#1C2024] leading-relaxed font-[Helvetica,_'ui-sans-serif'] mt-0 mb-4">
    {children}
  </p>
)
