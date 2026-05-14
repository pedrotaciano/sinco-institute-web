<script>
  const year = new Date().getFullYear();
</script>

<svelte:head>
  <title>Sinco Institute</title>
  <meta
    name="description"
    content="Design & development of community-driven software & hardware"
  />
</svelte:head>

<header>
  <h4>sinco institute &copy; {year}</h4>
</header>

<main>
  <section id="hero" aria-label="Sinco Institute introduction">
    <div class="hero-a">
      <img src="/assets/logo.svg" alt="Sinco Institute Logo" class="logo" />
      <div class="hero-image" aria-hidden="true"></div>
    </div>

    <div class="hero-b">
      <div class="text-container">
        <h3>
          we design & develop communities. <br />
          cultures.<br />
          <u>software.</u> <br />
          <u>hardware.</u>
        </h3>

        <h3>
          <u>manifesto.</u>
        </h3>
      </div>
    </div>
  </section>
</main>
